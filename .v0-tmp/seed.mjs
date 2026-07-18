import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
const rifa = await prisma.rifa.create({ data: { nome: "Rifa de Teste", premio: "Notebook", status: "ATIVA" } })
console.log(rifa.id)
await prisma.$disconnect()
