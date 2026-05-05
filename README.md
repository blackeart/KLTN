http://localhost:3001/admin-dashboard
http://localhost:3001/courses/class/view
http://localhost:3001/auth/admin
const history = await this.chatRepo.find({
where: { sessionId },
order: { createdAt: 'DESC' },
take: 5,
});
