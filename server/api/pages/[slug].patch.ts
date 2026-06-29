import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const slug = getRouterParam(event, 'slug')!
  const body = await readBody(event)

  const page = await prisma.page.update({
    where: { slug },
    data: {
      title: body.title,
      content: body.content,
      isVisible: body.isVisible,
    }
  })

  return page
})