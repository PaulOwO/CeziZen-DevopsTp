import prisma from "../utils/prisma"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const body = await readBody(event)

  if (!body || !body.title || !body.slug || !body.content) {
    throw createError({ statusCode: 400, message: 'Titre, slug et contenu obligatoires' })
  }

  const page = await prisma.page.create({
    data: {
      title: body.title,
      slug: body.slug,
      content: body.content,
      isVisible: body.isVisible ?? true,
    }
  })

  return page
})