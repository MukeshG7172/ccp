import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { writeFile } from 'fs/promises';
import { parse } from 'papaparse';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const csvFile = formData.get('csvFile');
    const email = formData.get('email');

    if (!csvFile || !(csvFile instanceof Blob)) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // Save CSV temporarily
    const uploadDir = join(process.cwd(), 'tmp', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filename = `${uuidv4()}.csv`;
    const filepath = join(uploadDir, filename);
    
    const bytes = await csvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Parse CSV
    const fileContent = await fs.readFile(filepath, 'utf-8');
    const parsedData = parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    // Validate CSV structure
    if (parsedData.data.length === 0) {
      await fs.unlink(filepath);
      return NextResponse.json({ error: 'The CSV file is empty' }, { status: 400 });
    }

    if (!parsedData.data[0].hasOwnProperty('waste_name')) {
      await fs.unlink(filepath);
      return NextResponse.json({ error: 'CSV must contain a "waste_name" column' }, { status: 400 });
    }

    // Process each waste item
    const results = [];
    const apiKey = process.env.GEMINI_API_KEY;
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

    for (const row of parsedData.data) {
      const wasteName = row.waste_name?.trim();
      
      if (!wasteName) {
        results.push({
          wasteName: '(empty)',
          error: 'Empty waste name'
        });
        continue;
      }

      try {
        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];
        
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        const thirtyDaysFormatted = thirtyDaysLater.toISOString().split('T')[0];

        const structuredPrompt = `
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
          results.push({
            wasteName,
            error: 'No response received from AI service'
          });
          continue;
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

        results.push({
          wasteName,
          disposalDate: aiResponse
        });
      } catch (error) {
        console.error(`Error processing waste item "${wasteName}":`, error);
        results.push({
          wasteName,
          error: 'Processing error'
        });
      }
    }

    // Clean up the temporary file
    try {
      await fs.unlink(filepath);
    } catch (cleanupError) {
      console.error('Error cleaning up temporary CSV file:', cleanupError);
    }

    return NextResponse.json({
      results,
      success: results.filter(item => !item.error).length,
      errors: results.filter(item => item.error).length
    });
  } catch (error) {
    console.error('Error in bulk waste processing service:', error);
    return NextResponse.json({ error: 'Bulk processing service error' }, { status: 500 });
  }
}