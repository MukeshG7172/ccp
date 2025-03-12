import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const product = formData.get('product');
    const imageFile = formData.get('image');

    if (!product && !imageFile) {
      return NextResponse.json({ error: 'Product name or image is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

    // Professional structured prompt with clear expectations
    const structuredPrompt = `
      As an environmental waste classification expert, provide a detailed analysis for ${product ? `"${product}"` : 'the item in the image'}.
      
      Reply STRICTLY in this format:
      
      **Waste Type Classification:**
      * **Degradable:** [Yes/No] - [concise explanation with scientific basis]
      * **Biodegradable:** [Yes/No] - [concise explanation with scientific basis]
      * **Non-degradable:** [Yes/No] - [concise explanation with scientific basis]
      
      **Storage and Disposal Instructions:**
      * **Storage:** [bullet points with specific storage guidelines]
      * **Disposal:** [bullet points with proper disposal methods according to environmental regulations]
      * **Possible Recycling Methods:** [bullet points with available recycling options and processes]
      * **Resale Value:** [estimate of potential circular economy value or statement of no resale value]
      
      Base all classifications on material composition, environmental impact, and current waste management best practices.
    `;

    let requestBody = {
      contents: [{
        parts: []
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      }
    };

    requestBody.contents[0].parts.push({
      text: structuredPrompt
    });

    if (imageFile) {
      const imageBuffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: imageFile.type,
          data: base64Image
        }
      });
    }

    const response = await axios.post(`${url}?key=${apiKey}`, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      maxBodyLength: Infinity,
    });

    let aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      return NextResponse.json({ error: 'No response received from classification service' }, { status: 500 });
    }

    // Format validation
    const hasWasteTypes = aiResponse.includes("**Waste Type Classification:**");
    const hasDisposalInstructions = aiResponse.includes("**Storage and Disposal Instructions:**");
    
    if (!hasWasteTypes || !hasDisposalInstructions) {
      // Retry with more explicit formatting requirements
      requestBody.contents[0].parts[0].text = `
        ${structuredPrompt}
        
        IMPORTANT: You MUST follow the EXACT format specified. Environmental assessment accuracy depends on proper formatting.
      `;
      
      const retryResponse = await axios.post(`${url}?key=${apiKey}`, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        maxBodyLength: Infinity,
      });
      
      aiResponse = retryResponse.data.candidates?.[0]?.content?.parts?.[0]?.text ?? aiResponse;
    }

    // Add identification metadata to the response
    let enhancedResponse = aiResponse;
    if (product) {
      enhancedResponse = `**Item Analyzed:** ${product}\n\n${aiResponse}`;
    }

    return NextResponse.json({ 
      result: enhancedResponse,
      timestamp: new Date().toISOString(),
      source: 'Environmental Classification System v1.2'
    });
  } catch (error) {
    console.error('Error in waste classification service:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 500;
    
    return NextResponse.json(
      { 
        error: 'Classification service error', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: statusCode }
    );
  }
}