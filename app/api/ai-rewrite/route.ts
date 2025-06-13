import { NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: Request) {
  const { videoTitle, videoDescription, transcript } = await request.json() // Receive transcript directly

  if (!videoTitle) {
    return NextResponse.json({ error: "Thiếu thông tin video để tạo nội dung AI." }, { status: 400 })
  }

  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  console.log("Google API Key loaded:", googleApiKey ? "Yes" : "No")

  if (!googleApiKey) {
    return NextResponse.json(
      { error: "Thiếu cấu hình API key cho Gemini. Vui lòng kiểm tra biến môi trường GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 500 },
    )
  }

  try {
    const prompt = `Viết lại nội dung video, tạo kịch bản cho một video viral tương tự.
  
  Tiêu đề video gốc: "${videoTitle}"
  Mô tả/Thống kê video gốc: "${videoDescription}"
  
  Nội dung chuyển đổi từ giọng nói của video:
  ${transcript || "[Không có transcript được cung cấp hoặc có lỗi khi lấy transcript.]"}
  
  Hãy tạo một kịch bản ngắn gọn, hấp dẫn, phù hợp với TikTok, tập trung vào việc thu hút người xem và thúc đẩy hành động (ví dụ: mua hàng, truy cập link). Sử dụng ngôn ngữ tự nhiên, thân thiện.`

    const { text } = await generateText({
      model: google("models/gemini-1.5-flash-latest", { apiKey: googleApiKey }),
      prompt: prompt,
    })

    // Trả về cả nội dung AI và transcript gốc đã nhận
    return NextResponse.json({ rewrite: text, transcript: transcript })
  } catch (error: any) {
    console.error("Error generating AI content:", error)
    return NextResponse.json({ error: `Không thể tạo nội dung AI: ${error.message}` }, { status: 500 })
  }
}
