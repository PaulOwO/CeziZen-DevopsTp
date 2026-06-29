declare module '#auth-utils' {
  interface User {
    id: number
    email: string
    firstName: string
    lastName: string
    role: 'USER' | 'ADMIN'
  }
}

export {}