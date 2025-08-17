import type { AppUser } from '../models/AppUser'

/**
 * Decodes a JWT token and maps its payload to an AppUser object.
 * @param token JWT token string
 * @returns Partial<AppUser> or null if decoding fails
 */
export function decodeJwtToAppUser(token: string): AppUser | null {
  try {
    const payloadBase64 = token.split('.')[1]
    if (!payloadBase64) return null

    // Pad base64 if needed
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)

    // Map JWT payload fields to AppUser fields, handling different casing and claim URIs
    const appUser: AppUser = {
      userId:
        payload.UserId ||
        payload.userId ||
        payload.sub ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email:
        payload.Email ||
        payload.email ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      userName:
        payload.UserName ||
        payload.userName ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      firstName: payload.FirstName || payload.firstName,
      lastName: payload.LastName || payload.lastName,
      userRole:
        payload.UserRole ||
        payload.userRole ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      phoneNumber: payload.PhoneNumber || payload.phoneNumber,
      token: token,
      tokenExpiration:
        payload.TokenExpiration ||
        (payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined),
    }
    return appUser
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}