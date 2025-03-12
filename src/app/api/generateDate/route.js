import { NextResponse } from 'next/server';
import axios from 'axios';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';

export async function POST(req) {
  try {
    const contentType = req.headers.get('content-type');
    
    let wasteName = '';
    let wasteImageData = null;
    
    if (contentType && contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      wasteName = formData.get('wasteName') || '';
      const wasteImage = formData.get('wasteImage');
      
      if (wasteImage && wasteImage instanceof Blob) {
        try {
          const uploadDir = join(process.cwd(), 'tmp', 'uploads');
          await fs.mkdir(uploadDir, { recursive: true });
          
          const uniqueId = uuidv4();
          const extension = wasteImage.name ? wasteImage.name.split('.').pop() : 'jpg';
          const filename = `${uniqueId}.${extension}`;
          const filepath = join(uploadDir, filename);
          
          const bytes = await wasteImage.arrayBuffer();
          const buffer = Buffer.from(bytes);
          await writeFile(filepath, buffer);
          
          wasteImageData = {
            path: filepath,
            filename: filename
          };
          
          if (!wasteName) {
            wasteName = "unidentified waste";
          }
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          return NextResponse.json({ error: 'Failed to process uploaded image' }, { status: 400 });
        }
      }
    } else {
      const body = await req.json();
      wasteName = body.wasteName || '';
    }

    if (!wasteName && !wasteImageData) {
      return NextResponse.json({ error: 'Waste name or image is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    const thirtyDaysFormatted = thirtyDaysLater.toISOString().split('T')[0];

    let structuredPrompt = `
      As a waste management expert, analyze the waste item "${wasteName}" and determine the most appropriate disposal date based on environmental guidelines.
      
      Consider the following factors:
      - Biodegradability of the material
      - Toxicity level and environmental impact
      - Current waste management recommendations
      - Collection schedules for different waste types
      - Seasonal considerations
      
      Today's date is ${todayFormatted}.
      
      Reply ONLY with a valid ISO 8601 date string (YYYY-MM-DD) that represents the recommended disposal date for this item.
      The date MUST be between ${todayFormatted} and ${thirtyDaysFormatted}, based on the waste type.
      
      For example:
      - Hazardous waste: Schedule further out (15-30 days)
      - Regular recyclables: Schedule within 7 days
      - Organic waste: Schedule within 3 days
      - E-waste: Schedule for specialized collection days (typically 10-20 days out)
      
      Reply with ONLY the date in YYYY-MM-DD format, nothing else.
    `;

    if (wasteImageData) {
      structuredPrompt = `
        As a waste management expert, I need to determine the most appropriate disposal date for a waste item.
        ${wasteName ? `The item is described as "${wasteName}"` : 'The item is shown in an uploaded image'}.
        
        Consider the following factors:
        - Biodegradability of the material
        - Toxicity level and environmental impact
        - Current waste management recommendations
        - Collection schedules for different waste types
        - Seasonal considerations
        
        Today's date is ${todayFormatted}.
        
        Reply ONLY with a valid ISO 8601 date string (YYYY-MM-DD) that represents the recommended disposal date for this item.
        The date MUST be between ${todayFormatted} and ${thirtyDaysFormatted}, based on the waste type.
        
        For example:
        - Hazardous waste: Schedule further out (15-30 days)
        - Regular recyclables: Schedule within 7 days
        - Organic waste: Schedule within 3 days
        - E-waste: Schedule for specialized collection days (typically 10-20 days out)
        
        Reply with ONLY the date in YYYY-MM-DD format, nothing else.
      `;
    }

    const requestBody = {
      contents: [{
        parts: [{ text: structuredPrompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 256,
      }
    };

    const response = await axios.post(`${url}?key=${apiKey}`, requestBody, {
      headers: { 'Content-Type': 'application/json' },
    });

    let aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      return NextResponse.json({ error: 'No response received from AI service' }, { status: 500 });
    }

    aiResponse = aiResponse.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dateRegex.test(aiResponse)) {
      const dateMatch = aiResponse.match(/\d{4}-\d{2}-\d{2}/);
      
      if (dateMatch) {
        aiResponse = dateMatch[0];
      } else {
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 7);
        aiResponse = fallbackDate.toISOString().split('T')[0];
      }
    }
    const responseDate = new Date(aiResponse);
    if (responseDate <= today) {
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      aiResponse = tomorrow.toISOString().split('T')[0];
    }
    
    if (responseDate > thirtyDaysLater) {
      aiResponse = thirtyDaysFormatted;
    }
    
    if (wasteImageData) {
      try {
        await fs.unlink(wasteImageData.path);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary image file:', cleanupError);
      }
    }

    return NextResponse.json({
      disposalDate: aiResponse
    });
  } catch (error) {
    console.error('Error in waste disposal date service:', error);
    return NextResponse.json({ error: 'Disposal date service error' }, { status: 500 });
  }
}