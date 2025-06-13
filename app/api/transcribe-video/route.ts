import { NextResponse } from "next/server"
import OpenAI from "openai"
import { supabase } from "@/lib/supabase"
import * as fs from "fs"
import { promises as fsPromises } from "fs"
import path from "path"
import { Readable } from "stream"
import { finished } from "stream/promises"

// Removed fluent-ffmpeg and ffmpeg-static imports

export async function POST(request: Request) {
  const { videoUrl } = await request.json()

  if (!videoUrl) {
    console.error("[Transcribe] Error: Missing video URL for transcription (400).")
    return NextResponse.json({ error: "Thiếu URL video để chuyển đổi giọng nói." }, { status: 400 })
  }

  const openaiApiKey = process.env.OPENAI_API_KEY
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("[Transcribe] Env Check: OpenAI API Key loaded:", openaiApiKey ? "Yes" : "No")
  console.log("[Transcribe] Env Check: Supabase URL loaded:", supabaseUrl ? "Yes" : "No")
  console.log("[Transcribe] Env Check: Supabase Service Role Key loaded:", supabaseServiceRoleKey ? "Yes" : "No")
  console.log(`[Transcribe] Starting transcription process for video: ${videoUrl}`)

  if (!openaiApiKey) {
    console.error("[Transcribe] Error: OpenAI API Key is missing (500).")
    return NextResponse.json(
      { error: "Thiếu cấu hình API key cho OpenAI. Vui lòng kiểm tra biến môi trường OPENAI_API_KEY." },
      { status: 500 },
    )
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[Transcribe] Error: Supabase configuration is missing (500).")
    return NextResponse.json(
      {
        error: "Thiếu cấu hình Supabase. Vui lòng kiểm tra biến môi trường SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 },
    )
  }

  let transcriptionContent = ""
  const openai = new OpenAI({ apiKey: openaiApiKey })
  let tempFilePath: string | null = null

  try {
    // --- BƯỚC 1: TẢI XUỐNG VIDEO VỀ FILE TẠM THỜI ---
    console.log(`[Transcribe] Step 1: Attempting to download video from: ${videoUrl}`)
    let videoResponse: Response
    try {
      videoResponse = await fetch(videoUrl)
    } catch (fetchErr: any) {
      console.error(`[Transcribe] Step 1 Error: Network error during video fetch: ${fetchErr.message}`)
      throw new Error(`Lỗi mạng khi tải video: ${fetchErr.message}`)
    }

    if (!videoResponse.ok || !videoResponse.body) {
      const errorStatus = videoResponse.status
      const errorText = await videoResponse.text()
      console.error(
        `[Transcribe] Step 1 Error: Failed to download video. Status: ${errorStatus}, Response: ${errorText.substring(0, 200)}`,
      )
      throw new Error(
        `Không thể tải video từ URL: ${videoUrl}. Mã lỗi: ${errorStatus}. Chi tiết: ${errorText.substring(0, 50)}...`,
      )
    }

    const urlParts = new URL(videoUrl).pathname.split(".")
    const fileExtension = urlParts.length > 1 ? urlParts.pop() : "mp4" // Keep original extension
    const fileName = `video-${Date.now()}.${fileExtension}`
    tempFilePath = path.join("/tmp", fileName)

    console.log(`[Transcribe] Step 1: Writing video to temporary file: ${tempFilePath}`)
    const fileStream = fs.createWriteStream(tempFilePath)
    try {
      await finished(Readable.fromWeb(videoResponse.body as any).pipe(fileStream))
    } catch (streamErr: any) {
      console.error(`[Transcribe] Step 1 Error: Stream piping failed: ${streamErr.message}`)
      throw new Error(`Lỗi khi ghi video vào file tạm thời: ${streamErr.message}`)
    }
    console.log(`[Transcribe] Step 1: Video downloaded successfully to: ${tempFilePath}`)

    // --- BƯỚC 2: TẢI FILE LÊN SUPABASE STORAGE (Tùy chọn, có thể bỏ qua nếu chỉ cần transcribe) ---
    // Tải file video gốc lên Supabase
    console.log(`[Transcribe] Step 2: Attempting to upload video to Supabase bucket 'tiktok-videos'.`)
    let fileBufferForSupabase: Buffer
    try {
      fileBufferForSupabase = await fsPromises.readFile(tempFilePath)
    } catch (readErr: any) {
      console.error(`[Transcribe] Step 2 Error: Failed to read temporary file for Supabase upload: ${readErr.message}`)
      throw new Error(`Không thể đọc file tạm thời để tải lên Supabase: ${readErr.message}`)
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("tiktok-videos") // Tên bucket của bạn
      .upload(fileName, fileBufferForSupabase, {
        contentType: videoResponse.headers.get("content-type") || `video/${fileExtension}`,
        upsert: true,
      })

    if (uploadError) {
      console.error("[Transcribe] Step 2 Error: Error uploading to Supabase:", uploadError)
      // Do not throw here, allow transcription to proceed if storage is optional
    } else {
      console.log(`[Transcribe] Step 2: Video uploaded to Supabase: ${uploadData?.path}`)
    }

    // --- BƯỚC 3: TRANSCRIBE VIDEO BẰNG OPENAI WHISPER ---
    console.log(`[Transcribe] Step 3: Attempting to transcribe video using OpenAI Whisper.`)
    let videoStreamForOpenAI: fs.ReadStream
    try {
      videoStreamForOpenAI = fs.createReadStream(tempFilePath) // Pass the video file directly
    } catch (readStreamErr: any) {
      console.error(`[Transcribe] Step 3 Error: Failed to create read stream for OpenAI: ${readStreamErr.message}`)
      throw new Error(`Không thể tạo stream đọc file video cho OpenAI: ${readStreamErr.message}`)
    }

    console.log(`[Transcribe] Preparing to call OpenAI Whisper API with file: ${tempFilePath}`)
    const transcription = await openai.audio.transcriptions.create({
      file: videoStreamForOpenAI, // Pass the ReadableStream of the video file
      model: "whisper-1", // Using whisper-1 as it supports more formats [^1]
    })
    transcriptionContent = transcription.text
    console.log(
      `[Transcribe] OpenAI Whisper API call completed. Transcription length: ${transcription.text.length} characters.`,
    )
    console.log("[Transcribe] Step 3: Video transcribed successfully.")

    return NextResponse.json({ transcript: transcriptionContent })
  } catch (transcribeError: any) {
    console.error("[Transcribe] Caught top-level error:", transcribeError.message)
    console.error(
      "[Transcribe] Full error object:",
      JSON.stringify(transcribeError, Object.getOwnPropertyNames(transcribeError)),
    )
    // Ensure any error is returned as JSON
    return NextResponse.json(
      {
        error: `Lỗi trong quá trình chuyển đổi giọng nói: ${transcribeError.message}. Vui lòng kiểm tra log chi tiết trên Vercel.`,
      },
      { status: 500 },
    )
  } finally {
    // --- BƯỚC 4: DỌN DẸP FILE TẠM THỜI ---
    if (tempFilePath) {
      try {
        await fsPromises.unlink(tempFilePath)
        console.log(`[Transcribe] Finally: Temporary video file deleted: ${tempFilePath}`)
      } catch (cleanupError) {
        console.error("[Transcribe] Finally: Error deleting temporary video file:", cleanupError)
      }
    }
  }
}
