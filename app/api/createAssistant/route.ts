/**
 * API Route - Create Assistant
 *
 * This route handles the creation of a new OpenAI assistant. It accepts POST requests
 * with necessary data such as assistant name, model, description, and an optional file ID.
 * This data is used to configure and create an assistant via the OpenAI API. The route
 * returns the ID of the newly created assistant, allowing for further operations involving
 * this assistant. It's designed to provide a seamless process for setting up customized
 * OpenAI assistants as per user requirements.
 *
 * Path: /api/createAssistant
 */
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Assistants, AssistantCreateParams } from 'openai/resources/beta/assistants/assistants';

// Define the structure of the request body based on the OpenAI assistant attributes
interface RequestBody {
  assistantName: string;
  assistantModel: string;
  assistantDescription: string;
  fileIds?: string[];
  tools?: string[]; 
  metadata?: { [key: string]: string };
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    if (req.method === 'POST') {
        try {
            const requestBody = await req.json() as RequestBody;
            console.log('Received request:', requestBody);

            const { assistantName, assistantModel, assistantDescription, fileIds, tools: toolNames, metadata } = requestBody;

            // Create the tools array with specific types for each tool
            const tools: (AssistantCreateParams.AssistantToolsCode | AssistantCreateParams.AssistantToolsRetrieval | AssistantCreateParams.AssistantToolsFunction)[] = toolNames?.map(toolName => {
                switch(toolName) {
                    case 'retrieval':
                        return { type: 'retrieval' } as AssistantCreateParams.AssistantToolsRetrieval;
                    case 'code_interpreter':
                        return { type: 'code_interpreter' } as AssistantCreateParams.AssistantToolsCode;
                    case 'function':
                        // Add specific configuration for 'function' type
                        return { 
                            type: 'function', 
                            function: {/* Function configuration here */} 
                        } as AssistantCreateParams.AssistantToolsFunction;
                    default:
                        return undefined;
                }
            }).filter(tool => tool !== undefined) as (AssistantCreateParams.AssistantToolsCode | AssistantCreateParams.AssistantToolsRetrieval | AssistantCreateParams.AssistantToolsFunction)[];

            const assistantOptions: Assistants.AssistantCreateParams = {
                name: assistantName,
                instructions: assistantDescription,
                model: assistantModel,
                tools: tools, 
                file_ids: fileIds || [],
                metadata: metadata,
            };
    
            const assistant = await openai.beta.assistants.create(assistantOptions);
            const assistantId = assistant.id;
    
            return NextResponse.json({ 
                message: 'Assistant created successfully', 
                assistantId: assistantId 
            });
        } catch (error) {
            console.error('Error:', error);
            return NextResponse.json({ 
                error: error instanceof Error ? error.message : 'An unknown error occurred' 
            });
        }
    } else {
        return NextResponse.json({ error: 'Method Not Allowed' });
    }
}