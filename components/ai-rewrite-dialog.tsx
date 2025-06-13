"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CopyIcon } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface AIRewriteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  aiContent: string | null
  originalTranscript: string | null // New prop for original transcript
  loading: boolean
  error: string | null
  videoTitle: string
  videoDescription: string // This will contain formatted stats
}

export function AIRewriteDialog({
  isOpen,
  onOpenChange,
  aiContent,
  originalTranscript, // Use new prop
  loading,
  error,
  videoTitle,
  videoDescription,
}: AIRewriteDialogProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopy = (content: string | null) => {
    if (content) {
      navigator.clipboard.writeText(content)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000) // Reset after 2 seconds
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">Gợi ý nội dung AI</DialogTitle>
          <DialogDescription className="text-gray-600">
            Dựa trên video: &quot;{videoTitle}&quot;
            <br />
            <span className="text-sm text-gray-500">{videoDescription}</span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Lỗi AI!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center h-[150px] text-gray-600">
            <svg
              className="animate-spin h-6 w-6 mr-3 text-blue-500"
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
            Đang tạo nội dung và chuyển đổi giọng nói...
          </div>
        )}

        {!loading && !error && (
          <>
            {originalTranscript && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Transcript gốc:</h3>
                <div className="min-h-[80px] max-h-[200px] overflow-y-auto p-3 border rounded-md bg-gray-50 text-gray-700 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap">{originalTranscript}</p>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => handleCopy(originalTranscript)}
                    className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-700"
                    size="sm"
                    disabled={copySuccess}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" />
                    {copySuccess ? "Đã sao chép!" : "Sao chép Transcript"}
                  </Button>
                </div>
                <Separator className="my-4" />
              </div>
            )}

            {aiContent && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Gợi ý nội dung AI:</h3>
                <div className="min-h-[100px] max-h-[300px] overflow-y-auto p-3 border rounded-md bg-gray-50 text-gray-700 text-sm leading-relaxed">
                  <p className="whitespace-pre-wrap">{aiContent}</p>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => handleCopy(aiContent)}
                    className="mr-2 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    disabled={copySuccess}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" />
                    {copySuccess ? "Đã sao chép!" : "Sao chép Gợi ý AI"}
                  </Button>
                </div>
              </div>
            )}

            {!originalTranscript && !aiContent && !loading && !error && (
              <p className="text-center text-gray-500 mt-8">Nhấn &quot;Viết lại nội dung&quot; để tạo gợi ý.</p>
            )}
          </>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
