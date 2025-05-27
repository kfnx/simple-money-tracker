
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

function processFinancialData(expenses: any[]) {
  const contexts = [];
  
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
    text: `Financial overview: Total income Rp.${totalIncome.toLocaleString('id-ID')}, total spent Rp.${totalSpent.toLocaleString('id-ID')}, balance Rp.${balance.toLocaleString('id-ID')}`,
    type: 'overview'
  });

  if (topCategories.length > 0) {
    contexts.push({
      text: `Top spending categories: ${topCategories.map(([cat, amount]) => `${cat} Rp.${amount.toLocaleString('id-ID')}`).join(', ')}`,
      type: 'categories'
    });
  }

  Object.entries(monthlyData).forEach(([month, data]) => {
    contexts.push({
      text: `${month}: spent Rp.${data.spent.toLocaleString('id-ID')}, income Rp.${data.income.toLocaleString('id-ID')}, net Rp.${(data.income - data.spent).toLocaleString('id-ID')}`,
      type: 'monthly'
    });
  });

  // Recent transactions
  const recentTransactions = expenses.slice(0, 10);
  recentTransactions.forEach(expense => {
    contexts.push({
      text: `${expense.type} on ${expense.date}: Rp.${Number(expense.amount).toLocaleString('id-ID')} for ${expense.category}${expense.note ? ` (${expense.note})` : ''}`,
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
  return data.data[0].embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function findRelevantContext(questionEmbedding: number[], contextEmbeddings: number[][], contexts: any[]) {
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

async function generateAIResponse(question: string, relevantContext: any[], allExpenses: any[]): Promise<string> {
  const contextText = relevantContext.map(ctx => ctx.text).join('\n');
  
  const systemPrompt = `You are SaldoAI, a personal finance assistant for Indonesian users. You have access to the user's real financial data and should provide personalized advice based on their actual spending patterns and financial situation.

Financial Context:
${contextText}

Guidelines:
- Use Indonesian Rupiah (Rp.) for all amounts
- Be conversational and helpful
- Provide specific, actionable advice based on their actual data
- If you notice concerning patterns, mention them kindly
- Celebrate good financial habits when you see them
- Keep responses concise but informative
- Use Indonesian number formatting (e.g., Rp.1.000.000)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
