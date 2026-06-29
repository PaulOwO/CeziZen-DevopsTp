import prisma from "../utils/prisma"

export default defineEventHandler(async () => {
  const pages = await prisma.page.findMany({
    where: { isVisible: true },
    orderBy: { title: 'asc' },
  })
  return pages
})