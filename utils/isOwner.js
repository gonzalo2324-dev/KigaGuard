require('dotenv').config();

/**
 * Devuelve true si el userId es uno de los owners definidos en el .env
 */
function isOwner(userId) {
  const ownerIds = process.env.OWNERS?.split(',') || [];
  return ownerIds.includes(userId);
}

module.exports = isOwner;
