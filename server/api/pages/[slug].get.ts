import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!

  const page = await prisma.page.findUnique({
    where: { slug },
  })

  if (!page || !page.isVisible) {
    throw createError({ statusCode: 404, message: 'Page introuvable' })
  }

  return page
})