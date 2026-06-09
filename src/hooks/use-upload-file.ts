import * as React from 'react'
import { toast } from 'sonner'

// MinIO(/api/v1/media)로 업로드. UploadThing 대신 자체 엔드포인트 사용.
export type UploadedFile = {
  id?: number
  key: string
  url: string
  name: string
  size: number
  type: string
}

interface UseUploadFileProps {
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (error: unknown) => void
}

export function useUploadFile({ onUploadComplete, onUploadError }: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>()
  const [uploadingFile, setUploadingFile] = React.useState<File>()
  const [progress, setProgress] = React.useState<number>(0)
  const [isUploading, setIsUploading] = React.useState(false)

  async function uploadFile(file: File): Promise<UploadedFile> {
    setIsUploading(true)
    setUploadingFile(file)
    try {
      const result = await new Promise<UploadedFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const form = new FormData()
        form.append('file', file)
        xhr.open('POST', '/api/v1/media')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.min(Math.round((e.loaded / e.total) * 100), 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const d = JSON.parse(xhr.responseText)
            resolve({ ...d, name: file.name, size: file.size, type: file.type })
          } else {
            reject(new Error(`업로드 실패 (${xhr.status})`))
          }
        }
        xhr.onerror = () => reject(new Error('네트워크 오류'))
        xhr.send(form)
      })
      setUploadedFile(result)
      onUploadComplete?.(result)
      return result
    } catch (error) {
      toast.error(getErrorMessage(error))
      onUploadError?.(error)
      throw error
    } finally {
      setProgress(0)
      setIsUploading(false)
      setUploadingFile(undefined)
    }
  }

  return { isUploading, progress, uploadedFile, uploadFile, uploadingFile }
}

export function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message
  return '문제가 발생했습니다. 잠시 후 다시 시도하세요.'
}

export function showErrorToast(err: unknown) {
  return toast.error(getErrorMessage(err))
}
