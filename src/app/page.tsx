"use client"

import Loading from "@/components/admin/layouts/Loading"
import { useEffect, useState } from "react"

const MainPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        setLoading(false)
      }, 3000);
    }
  }, [loading])

  return loading ?
    <Loading />
    : (
      <>
        Main Page (Si Mandalika)
      </>
    )
}

export default MainPage