import os
import asyncpg
import random
from langchain_core.tools import tool

async def get_db_connection():

	url = os.getenv("DATABASE_URL")

	conn = await asyncpg.connect(url)

	return conn

@tool
async def attack_enemy(target: str, attacker_id: str):
	"""
	Logic for attacking an enemy.
	"""
	conn = await get_db_connection()

	try:
		enemy = await conn.fetchrow("SELECT * FROM monsters WHERE name = $1", target)

		if not enemy:
			return f"Error: No enemy named {target} found here."

		dice_roll = random.randint(1, 20)
		damage = 5 + (dice_roll // 2) #exemple de regle a changer, il faut trouver une idee pour les des.

		new_hp = enemy['hp'] - damage
		await conn.execute("UPDATE monsters SET hp = $1 WHERE id = $2", new_hp, enemy['id'])

		return {
			"success": True,
			"damage": damage,
			"target_hp_left": new_hp,
			"dice_roll": dice_roll,
			"is_dead": new_hp <= 0
		}
	finally:
		await conn.close()

