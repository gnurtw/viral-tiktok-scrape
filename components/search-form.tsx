"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"

interface SearchFormProps {
  onSearch: (keyword: string, publishTime: string) => void
  loading: boolean
  searchesRemaining: number
  isLimitReached: boolean
  publishTime: string
  setPublishTime: (time: string) => void
}

export function SearchForm({
  onSearch,
  loading,
  searchesRemaining,
  isLimitReached,
  publishTime,
  setPublishTime,
}: SearchFormProps) {
  const [inputKeyword, setInputKeyword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputKeyword.trim() && !loading && !isLimitReached) {
      onSearch(inputKeyword, publishTime)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex w-full max-w-md items-center space-x-2 mx-auto">
        <Input
          type="text"
          placeholder="Nhập từ khóa (ví dụ: 'review son môi', 'mẹo giảm cân')"
          value={inputKeyword}
          onChange={(e) => setInputKeyword(e.target.value)}
          className="flex-grow px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading || isLimitReached}
          aria-label="Từ khóa tìm kiếm TikTok"
        />
        <select
          value={publishTime}
          onChange={(e) => setPublishTime(e.target.value)}
          className="px-4 py-2 border rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading || isLimitReached}
          aria-label="Thời gian đăng tải"
        >
          <option value="0">Hôm nay</option>
          <option value="7">7 ngày qua</option>
          <option value="30">30 ngày qua</option>
          <option value="90">90 ngày qua</option>
          <option value="180">180 ngày qua</option>
        </select>
        <Button
          type="submit"
          disabled={loading || isLimitReached || !inputKeyword.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          {loading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang tìm...
            </span>
          ) : (
            <>
              <SearchIcon className="h-5 w-5 mr-2" /> Tìm
            </>
          )}
        </Button>
      </div>
      <p className="text-center text-sm text-gray-500 mt-2">
        Bạn còn {searchesRemaining} lượt tìm kiếm hôm nay.
        {isLimitReached && <span className="text-red-500 font-medium ml-1">(Đã đạt giới hạn)</span>}
      </p>
    </form>
  )
}
