import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

interface FinancialContext {
  text: string;
  type: 'overview' | 'categories' | 'monthly' | 'transaction';
}

interface Expense {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  date: string;
  note?: string;
}

interface FinancialFunctions {
  getTotalSpending: (dateRange?: { start: string; end: string }) => Promise<{ total: number; currency: string }>;
  getCategorySpending: (category: string, dateRange?: { start: string; end: string }) => Promise<{ total: number; currency: string }>;
  getMonthlySpending: (month: string) => Promise<{ total: number; currency: string }>;
  getTopCategories: (limit?: number) => Promise<Array<{ category: string; amount: number }>>;
  getRecentTransactions: (limit?: number) => Promise<Array<{ type: string; amount: number; category: string; date: string }>>;
}

// Define the available functions for the AI
const availableFunctions: {
  getTotalSpending: (expenses: Expense[], dateRange?: { start: string; end: string }) => Promise<{ total: number; currency: string }>;
  getCategorySpending: (expenses: Expense[], category: string, dateRange?: { start: string; end: string }) => Promise<{ total: number; currency: string }>;
  getMonthlySpending: (expenses: Expense[], month: string) => Promise<{ total: number; currency: string }>;
  getTopCategories: (expenses: Expense[], limit?: number) => Promise<Array<{ category: string; amount: number }>>;
  getRecentTransactions: (expenses: Expense[], limit?: number) => Promise<Array<{ type: string; amount: number; category: string; date: string }>>;
} = {
  getTotalSpending: async (expenses: Expense[], dateRange?: { start: string; end: string }) => {
    const filteredExpenses = dateRange 
      ? expenses.filter(e => e.type === 'expense' && e.date >= dateRange.start && e.date <= dateRange.end)
      : expenses.filter(e => e.type === 'expense');
    
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { total, currency: 'IDR' };
  },

  getCategorySpending: async (expenses: Expense[], category: string, dateRange?: { start: string; end: string }) => {
    const filteredExpenses = dateRange
      ? expenses.filter(e => e.type === 'expense' && e.category === category && e.date >= dateRange.start && e.date <= dateRange.end)
      : expenses.filter(e => e.type === 'expense' && e.category === category);
    
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { total, currency: 'IDR' };
  },

  getMonthlySpending: async (expenses: Expense[], month: string) => {
    const filteredExpenses = expenses.filter(e => 
      e.type === 'expense' && 
      e.date.startsWith(month)
    );
    
    const total = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return { total, currency: 'IDR' };
  },

  getTopCategories: async (expenses: Expense[], limit: number = 5) => {
    const categories = expenses.reduce((acc: Record<string, number>, expense) => {
      if (expense.type === 'expense') {
        acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      }
      return acc;
    }, {});

    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([category, amount]) => ({ category, amount }));
  },

  getRecentTransactions: async (expenses: Expense[], limit: number = 5) => {
    return expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map(e => ({
        type: e.type,
        amount: Number(e.amount),
        category: e.category,
        date: e.date
      }));
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, authToken } = await req.json();

    if (!question) {
      throw new Error('Question is required');
    }

    if (!authToken) {
      throw new Error('Authentication required');
    }

    // Initialize Supabase client with user's auth token
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    console.log('Fetching user expenses and income...');

    // Fetch user's expenses and income
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError);
      throw new Error('Failed to fetch financial data');
    }

    console.log(`Found ${expenses?.length || 0} financial records`);

    // Process financial data into context
    const financialContext = processFinancialData(expenses || []);

    // Create embeddings for the question and financial context
    const questionEmbedding = await createEmbedding(question);
    const contextEmbeddings = await Promise.all(
      financialContext.map(context => createEmbedding(context.text))
    );

    // Find most relevant context using cosine similarity
    const relevantContext = findRelevantContext(questionEmbedding, contextEmbeddings, financialContext);

    // Generate AI response with relevant context
    const aiResponse = await generateAIResponse(question, relevantContext, expenses || []);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-finance-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function processFinancialData(expenses: Expense[]) {
  const contexts: FinancialContext[] = [];
  
  // Calculate totals
  const totalSpent = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalSpent;

  // Category analysis
  const categories = expenses.reduce((acc: Record<string, number>, expense) => {
    if (expense.type === 'expense') {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
    }
    return acc;
  }, {});

  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Monthly spending patterns
  const monthlyData = expenses.reduce((acc: Record<string, { spent: number, income: number }>, expense) => {
    const month = new Date(expense.date).toISOString().slice(0, 7);
    if (!acc[month]) acc[month] = { spent: 0, income: 0 };
    
    if (expense.type === 'expense') {
      acc[month].spent += Number(expense.amount);
    } else {
      acc[month].income += Number(expense.amount);
    }
    return acc;
  }, {});

  // Create context strings for embeddings
  contexts.push({
    text: `Financial overview: Total income Rp ${totalIncome.toLocaleString('id-ID')}, total spent Rp ${totalSpent.toLocaleString('id-ID')}, balance Rp ${balance.toLocaleString('id-ID')}`,
    type: 'overview'
  });

  if (topCategories.length > 0) {
    contexts.push({
      text: `Top spending categories: ${topCategories.map(([cat, amount]) => `${cat} Rp ${amount.toLocaleString('id-ID')}`).join(', ')}`,
      type: 'categories'
    });
  }

  Object.entries(monthlyData).forEach(([month, data]) => {
    contexts.push({
      text: `${month}: spent Rp ${data.spent.toLocaleString('id-ID')}, income Rp ${data.income.toLocaleString('id-ID')}, net Rp ${(data.income - data.spent).toLocaleString('id-ID')}`,
      type: 'monthly'
    });
  });

  // Recent transactions
  const recentTransactions = expenses.slice(0, 10);
  recentTransactions.forEach(expense => {
    contexts.push({
      text: `${expense.type} on ${expense.date}: Rp ${Number(expense.amount).toLocaleString('id-ID')} for ${expense.category}${expense.note ? ` (${expense.note})` : ''}`,
      type: 'transaction'
    });
  });

  return contexts;
}

async function createEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  const data = await response.json();
  console.log("embedding data", data.data[0]);
  return data.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function findRelevantContext(questionEmbedding: number[], contextEmbeddings: number[][], contexts: FinancialContext[]) {
  const similarities = contextEmbeddings.map((embedding, index) => ({
    similarity: cosineSimilarity(questionEmbedding, embedding),
    context: contexts[index]
  }));

  // Return top 5 most relevant contexts
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
    .map(item => item.context);
}

async function generateAIResponse(question: string, relevantContext: FinancialContext[], allExpenses: Expense[]): Promise<string> {
  const contextText = relevantContext.map(ctx => ctx.text).join('\n');
  
  const systemPrompt = `You are SaldoAI, a personal finance assistant. You have access to the user's real financial data and should provide personalized advice based on their actual spending patterns and financial situation.

Financial Context:
${contextText}

Available Functions:
- getTotalSpending(dateRange?: { start: string; end: string }): Get total spending for a date range
- getCategorySpending(category: string, dateRange?: { start: string; end: string }): Get spending for a specific category
- getMonthlySpending(month: string): Get spending for a specific month (YYYY-MM format)
- getTopCategories(limit?: number): Get top spending categories
- getRecentTransactions(limit?: number): Get recent transactions

Guidelines:
- Use Indonesian Rupiah (Rp ) for all amounts
- Be conversational and helpful
- Provide specific, actionable advice based on their actual data
- If you notice concerning patterns, mention them kindly
- Celebrate good financial habits when you see them
- Keep responses concise but informative
- Use Indonesian number formatting (e.g., Rp 1.000.000)
- When you need specific data, use the available functions
- Use both the provided context and function calls to give the most accurate and helpful response`;

  // First, let's get the initial response with function calling
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      functions: [
        {
          name: 'getTotalSpending',
          description: 'Get total spending for a date range',
          parameters: {
            type: 'object',
            properties: {
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
                  end: { type: 'string', description: 'End date in YYYY-MM-DD format' }
                }
              }
            }
          }
        },
        {
          name: 'getCategorySpending',
          description: 'Get spending for a specific category',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Category name' },
              dateRange: {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
                  end: { type: 'string', description: 'End date in YYYY-MM-DD format' }
                }
              }
            },
            required: ['category']
          }
        },
        {
          name: 'getMonthlySpending',
          description: 'Get spending for a specific month',
          parameters: {
            type: 'object',
            properties: {
              month: { type: 'string', description: 'Month in YYYY-MM format' }
            },
            required: ['month']
          }
        },
        {
          name: 'getTopCategories',
          description: 'Get top spending categories',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of categories to return' }
            }
          }
        },
        {
          name: 'getRecentTransactions',
          description: 'Get recent transactions',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of transactions to return' }
            }
          }
        }
      ],
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  const message = data.choices[0].message;
  let finalResponse = '';

  // If the AI wants to call a function
  if (message.function_call) {
    const functionName = message.function_call.name;
    const functionArgs = JSON.parse(message.function_call.arguments);
    
    // Call the function with the expenses data
    const functionResult = await availableFunctions[functionName](allExpenses, ...Object.values(functionArgs));
    
    // Get a new response from the AI with both the function result and context
    const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
          { role: 'function', name: functionName, content: JSON.stringify(functionResult) }
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    const secondData = await secondResponse.json();
    finalResponse = secondData.choices[0].message.content;
  } else {
    finalResponse = message.content;
  }

  // Now, let's enhance the response with additional context if needed
  const enhancedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
        { role: 'assistant', content: finalResponse },
        { role: 'user', content: 'Please enhance this response with any additional insights from the financial context that could be helpful.' }
      ],
      temperature: 0.5,
      max_tokens: 500,
    }),
  });

  const enhancedData = await enhancedResponse.json();
  return enhancedData.choices[0].message.content;
}
