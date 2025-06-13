import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { keyword, publishTime } = await request.json() // Extract publishTime

  if (!keyword) {
    return NextResponse.json({ error: "Từ khóa tìm kiếm không được để trống." }, { status: 400 })
  }

  const rapidApiKey = process.env.TIKTOK_RAPIDAPI_KEY
  const rapidApiHost = process.env.TIKTOK_RAPIDAPI_HOST

  if (!rapidApiKey || !rapidApiHost) {
    return NextResponse.json({ error: "Thiếu cấu hình API key hoặc host cho TikTok Scraper." }, { status: 500 })
  }

  const params = new URLSearchParams({
    keywords: keyword,
    region: "us",
    count: "10",
    cursor: "0",
    publish_time: publishTime, // Use publishTime from request
    sort_type: "0",
  })

  const url = `https://${rapidApiHost}/feed/search?${params.toString()}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": rapidApiHost,
        "x-rapidapi-key": rapidApiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("TikTok API error:", response.status, errorText)
      return NextResponse.json(
        {
          error: `Lỗi từ TikTok API: ${response.status} - ${errorText.substring(0, 100)}...`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    const videos = data.data?.videos
      ?.map((video: any) => {
        // Filter out videos without a valid ID at the source
        if (!video.id) {
          console.warn("Video found without a valid ID, skipping:", video)
          return null // Return null for invalid videos
        }

        const play_count = video.play_count || 0
        const digg_count = video.digg_count || 0
        const share_count = video.share_count || 0

        // Calculate Engagement Rate = (digg_count / play_count) * 100%
        // Round to 1 decimal place as requested
        const engagement_rate = play_count > 0 ? ((digg_count / play_count) * 100).toFixed(1) : "0.0"

        return {
          id: video.id,
          title: video.title || video.music_info?.title || video.desc || "Không có tiêu đề", // Prioritize video.title
          play_count,
          digg_count,
          share_count,
          engagement_rate: `${engagement_rate}%`,
          cover_url: video.cover || video.music_info?.cover || video.video?.cover || "/placeholder.svg", // Prioritize video.cover
          video_url: video.play || video.video?.play_addr?.url_list?.[0] || "#", // Prioritize video.play
        }
      })
      .filter(Boolean) // Remove null entries

    return NextResponse.json({ videos: videos || [] })
  } catch (error: any) {
    console.error("Error fetching TikTok videos:", error)
    return NextResponse.json({ error: `Không thể kết nối đến TikTok Scraper API: ${error.message}` }, { status: 500 })
  }
}
