function getEventStatus(event) {
  const now = new Date();
  const eventDate = new Date(event.date);
  const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000);

  if (now < eventDate) return 'upcoming';
  if (now >= eventDate && now <= endDate) return 'ongoing';
  return 'completed';
}

function formatEvent(event) {
  const plain = event.toJSON ? event.toJSON() : event;
  return { ...plain, eventStatus: getEventStatus(plain) };
}

module.exports = { getEventStatus, formatEvent };
