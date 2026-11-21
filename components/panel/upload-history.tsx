'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { faNumber } from '@/lib/format'

interface Props {
  factoryId: string
}

export function UploadHistory({ factoryId }: Props) {
  const { uploadLogs } = useStore()
  const logs = useMemo(
    () =>
      uploadLogs
        .filter((l) => l.factoryId === factoryId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [uploadLogs, factoryId],
  )

  return (
    <div className="space-y-3">
      <h3 className="font-bold">تاریخچه‌ی آپلودها</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">هنوز فایلی آپلود نشده است.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="p-2 text-start font-medium">تاریخ</th>
                <th className="p-2 text-start font-medium">فایل</th>
                <th className="p-2 text-center font-medium">آپدیت</th>
                <th className="p-2 text-center font-medium">جدید</th>
                <th className="p-2 text-center font-medium">حذف/صفر</th>
                <th className="p-2 text-center font-medium">خطا</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="whitespace-nowrap p-2">
                    {new Date(l.createdAt).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="max-w-[160px] truncate p-2" title={l.filename}>
                    {l.filename}
                  </td>
                  <td className="p-2 text-center">{faNumber(l.rowsUpdated)}</td>
                  <td className="p-2 text-center">{faNumber(l.rowsCreated)}</td>
                  <td className="p-2 text-center">{faNumber((l.rowsRemoved ?? 0) + (l.rowsZeroed ?? 0))}</td>
                  <td className={`p-2 text-center ${l.rowsFailed > 0 ? 'text-destructive' : ''}`}>
                    {faNumber(l.rowsFailed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}