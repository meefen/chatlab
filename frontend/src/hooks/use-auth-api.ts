import { useAuth } from '../context/AuthContext'
import { useCallback } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export function useAuthApi() {
  const { getAccessToken } = useAuth()

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getAccessToken()
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response
    },
    [getAccessToken]
  )

  const get = useCallback(
    (url: string) => authenticatedFetch(url),
    [authenticatedFetch]
  )

  const post = useCallback(
    (url: string, data: any) =>
      authenticatedFetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [authenticatedFetch]
  )

  const put = useCallback(
    (url: string, data: any) =>
      authenticatedFetch(url, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    [authenticatedFetch]
  )

  const del = useCallback(
    (url: string) =>
      authenticatedFetch(url, {
        method: 'DELETE',
      }),
    [authenticatedFetch]
  )

  return {
    authenticatedFetch,
    get,
    post,
    put,
    delete: del,
  }
}