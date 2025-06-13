"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { formatNumber } from "@/lib/utils"

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

interface VideoResultsProps {
  videos: Video[]
  onAIRewrite: (video: Video) => void
}

export function VideoResults({ videos, onAIRewrite }: VideoResultsProps) {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full bg-white rounded-lg shadow-sm">
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="w-[80px] text-gray-700">Ảnh bìa</TableHead>
            <TableHead className="min-w-[200px] text-gray-700">Tiêu đề</TableHead>
            <TableHead className="text-right text-gray-700">Lượt xem</TableHead>
            <TableHead className="text-right text-gray-700">Lượt thích</TableHead>
            <TableHead className="text-right text-gray-700">Lượt chia sẻ</TableHead>
            <TableHead className="text-right text-gray-700">Tỷ lệ tương tác</TableHead>
            <TableHead className="text-center text-gray-700">Hành động</TableHead>
            <TableHead className="text-center text-gray-700">Nguồn</TableHead> {/* New Source column header */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => {
            const isTranscribing = false
            const hasTranscript = false

            return (
              <TableRow key={video.id} className="hover:bg-gray-50">
                <TableCell>
                  <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="block">
                    <Image
                      src={video.cover_url || "/placeholder.svg?height=60&width=60"}
                      alt={video.title}
                      width={60}
                      height={60}
                      className="rounded-md object-cover aspect-square"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=60&width=60"
                      }}
                    />
                  </a>
                </TableCell>
                <TableCell className="font-medium text-gray-800 max-w-[300px] truncate">
                  <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {video.title}
                  </a>
                </TableCell>
                <TableCell className="text-right text-gray-700">{formatNumber(video.play_count)}</TableCell>
                <TableCell className="text-right text-gray-700">{formatNumber(video.digg_count)}</TableCell>
                <TableCell className="text-right text-gray-700">{formatNumber(video.share_count)}</TableCell>
                <TableCell className="text-right font-semibold text-green-600">{video.engagement_rate}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAIRewrite(video)}
                      disabled={isTranscribing}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 w-full"
                    >
                      Viết lại nội dung
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {" "}
                  {/* New Source column cell */}
                  <a
                    href={`https://www.tiktok.com/player/v1/${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Xem trên TikTok
                  </a>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
