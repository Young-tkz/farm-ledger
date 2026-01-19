import { prisma } from '@/lib/prisma'
import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
    try {
        // 1. Unpack the message
        const formData = await request.formData()
        const phoneNumber = formData.get('From')?.toString().replace('whatsapp:', '') || ''
        const messageText = formData.get('Body')?.toString() || ''
        const mediaUrl = formData.get('MediaUrl0')?.toString() || null

        console.log(`📩 Message received from: ${phoneNumber}`)

        // 2. The "Guest List" Check
        const user = await prisma.user.findUnique({
            where: { phoneNumber: phoneNumber }
        })

        if (!user) {
            console.log(`🚫 Unauthorized sender: ${phoneNumber}`)
            return new Response(null, { status: 200 })
        }

        // 3. ASK THE AI (GROQ) TO ANALYZE
        // We only ask AI if it's a text message (not an image)
        let aiResponseText = messageText;

        if (!mediaUrl && messageText) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `You are a farm accountant helper. 
                        The user will send a messy message like "Paid 500 for seeds" or "Sold wheat 2000".
                        You must reply with a clean, short summary string in this format:
                        "[TYPE] Item - Amount"
                        
                        Examples:
                        User: "Paid 500 for seeds" -> Reply: "[EXPENSE] Seeds - 500"
                        User: "Sold 20kg tomato for 400rs" -> Reply: "[INCOME] Tomato (20kg) - 400"
                        User: "Meeting at 5pm" -> Reply: "[NOTE] Meeting at 5pm - 0"
                        
                        Only reply with the string. No other text.`
                        },
                        {
                            role: "user",
                            content: messageText,
                        },
                    ],
                    model: "llama-3.3-70b-versatile", // This model is super fast and free
                });

                // This is the clean text from the AI
                aiResponseText = completion.choices[0]?.message?.content || messageText;
                console.log(`🤖 AI Analysis: ${aiResponseText}`);

            } catch (aiError) {
                console.error("AI Error:", aiError);
                // If AI fails, we just keep the original text
            }
        }

        // 4. Save the CLEANED AI version to database
        await prisma.entry.create({
            data: {
                userId: user.id,
                type: mediaUrl ? 'image' : 'text',
                content: aiResponseText, // Saving the AI summary!
                mediaUrl: mediaUrl
            }
        })

        console.log(`✅ Saved entry from ${user.name}`)

        // 5. REPLY TO WHATSAPP
        const xmlResponse = `
    <Response>
        <Message>
            ✅ Saved!
            ${aiResponseText}
        </Message>
    </Response>
    `

        return new Response(xmlResponse, {
            headers: { 'Content-Type': 'text/xml' },
        })

    } catch (error) {
        console.error('Error processing message:', error)
        return new Response(`<Response><Message>❌ Error</Message></Response>`, {
            headers: { 'Content-Type': 'text/xml' },
            status: 200
        })
    }
}