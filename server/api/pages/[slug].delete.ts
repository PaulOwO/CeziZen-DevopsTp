import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const slug = getRouterParam(event, 'slug')!

  await prisma.menuPage.deleteMany({
    where: { page: { slug } }
  })

  await prisma.page.delete({ where: { slug } })

  return { success: true }
})