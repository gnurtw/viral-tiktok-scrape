"use client"

import { useState, useEffect, useCallback } from "react"
import { SearchForm } from "@/components/search-form"
import { VideoResults } from "@/components/video-results"
import { AIRewriteDialog } from "@/components/ai-rewrite-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Video {
  id: string
  title: string
  play_count: number
  digg_count: number
  share_count: number
  engagement_rate: string
  cover_url: string
  video_url: string
}

const DAILY_SEARCH_LIMIT = 5
const LOCAL_STORAGE_KEY_COUNT = "tiktok_search_count"
const LOCAL_STORAGE_KEY_DATE = "tiktok_search_date"

export default function HomePage() {
  const [keyword, setKeyword] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchesRemaining, setSearchesRemaining] = useState(DAILY_SEARCH_LIMIT)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const [publishTime, setPublishTime] = useState("0")

  // Re-enable state variables related to transcription and AI rewrite
  const [isAIRewriteDialogOpen, setIsAIRewriteDialogOpen] = useState(false)
  const [currentVideoForAI, setCurrentVideoForAI] = useState<{
    title: string
    description?: string
    videoUrl?: string
  } | null>(null)
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Initialize search count and date from local storage
  useEffect(() => {
    const storedCount = localStorage.getItem(LOCAL_STORAGE_KEY_COUNT)
    const storedDate = localStorage.getItem(LOCAL_STORAGE_KEY_DATE)
    const today = new Date().toDateString()

    if (storedDate === today && storedCount !== null) {
      const count = Number.parseInt(storedCount, 10)
      setSearchesRemaining(DAILY_SEARCH_LIMIT - count)
      if (count >= DAILY_SEARCH_LIMIT) {
        setIsLimitReached(true)
      }
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_COUNT, "0")
      localStorage.setItem(LOCAL_STORAGE_KEY_DATE, today)
      setSearchesRemaining(DAILY_SEARCH_LIMIT)
      setIsLimitReached(false)
    }
  }, [])

  // Update local storage on search count change
  useEffect(() => {
    const today = new Date().toDateString()
    localStorage.setItem(LOCAL_STORAGE_KEY_COUNT, (DAILY_SEARCH_LIMIT - searchesRemaining).toString())
    localStorage.setItem(LOCAL_STORAGE_KEY_DATE, today)
    setIsLimitReached(searchesRemaining <= 0)
  }, [searchesRemaining])

  const handleSearch = useCallback(
    async (searchKeyword: string, selectedPublishTime: string) => {
      if (isLimitReached) {
        setError("Bạn đã đạt giới hạn tìm kiếm hàng ngày.")
        return
      }

      setLoading(true)
      setError(null)
      setVideos([])
      setKeyword(searchKeyword)

      try {
        const response = await fetch("/api/tiktok-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ keyword: searchKeyword, publishTime: selectedPublishTime }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Đã có lỗi xảy ra khi tìm kiếm.")
        }

        const data = await response.json()
        setVideos(data.videos)
        setSearchesRemaining((prev) => Math.max(0, prev - 1))
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [isLimitReached, searchesRemaining],
  )

  const handleAIRewrite = useCallback(
    async (video: Video) => {
      const transcript = "" // Thay thế bằng một chuỗi rỗng hoặc xử lý khác nếu cần

      setCurrentVideoForAI({
        title: video.title,
        description: `Lượt xem: ${video.play_count}, Lượt thích: ${video.digg_count}, Lượt chia sẻ: ${video.share_count}`,
        videoUrl: video.video_url,
      })
      setAiGeneratedContent(null)
      setAiError(null)
      setAiLoading(true)
      setIsAIRewriteDialogOpen(true)

      try {
        const response = await fetch("/api/ai-rewrite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoTitle: video.title,
            videoDescription: `Video này có ${video.play_count} lượt xem, ${video.digg_count} lượt thích, ${video.share_count} lượt chia sẻ.`,
            transcript: transcript, // Vẫn truyền transcript (có thể là rỗng)
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Đã có lỗi xảy ra khi tạo nội dung AI: ${response.statusText}`)
        }

        const data = await response.json()
        setAiGeneratedContent(data.rewrite)
      } catch (err: any) {
        setAiError(err.message)
      } finally {
        setAiLoading(false)
      }
    },
    [], // Thay đổi dependency array thành rỗng hoặc các dependency khác cần thiết
  )

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12 bg-gray-50">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800">TikTok Viral Content Finder</CardTitle>
          <p className="text-center text-gray-600 mt-2">
            Tìm kiếm video TikTok viral, tính toán chỉ số và gợi ý nội dung AI cho Affiliate Marketing.
          </p>
        </CardHeader>
        <CardContent>
          <SearchForm
            onSearch={handleSearch}
            loading={loading}
            searchesRemaining={searchesRemaining}
            isLimitReached={isLimitReached}
            publishTime={publishTime}
            setPublishTime={setPublishTime}
          />

          {error && (
            <Alert variant="destructive" className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Lỗi!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && <div className="text-center mt-8 text-gray-600">Đang tìm kiếm video...</div>}

          {!loading && videos.length > 0 && (
            <>
              <Separator className="my-8" />
              <VideoResults videos={videos} onAIRewrite={handleAIRewrite} />
            </>
          )}

          {!loading && !error && videos.length === 0 && keyword && (
            <div className="text-center mt-8 text-gray-600">
              Không tìm thấy video nào cho từ khóa &quot;{keyword}&quot;.
            </div>
          )}
        </CardContent>
      </Card>

      <AIRewriteDialog
        isOpen={isAIRewriteDialogOpen}
        onOpenChange={setIsAIRewriteDialogOpen}
        aiContent={aiGeneratedContent}
        loading={aiLoading}
        error={aiError}
        videoTitle={currentVideoForAI?.title || ""}
        videoDescription={currentVideoForAI?.description || ""}
      />
    </main>
  )
}
