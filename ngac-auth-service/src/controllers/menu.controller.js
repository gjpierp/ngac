require('dotenv').config();

/**
 * @function    getMenuNgac
 * @description Genera el menú dinámico delegando la evaluación del contexto
 *              al backend de administración a través de una petición HTTP.
 *              Esto asegura consistencia con el caché del grafo en memoria.
 * @param       {object} req - Objeto de petición Express.
 * @param       {object} res - Objeto de respuesta Express.
 * @returns     {Promise<void>}
 */
async function getMenuNgac(req, res) {
  try {
    const { contexto } = req.body;

    if (!contexto) {
      return res.status(400).json({ error: 'Se requiere el campo "contexto"' });
    }

    let claims = [];
    if (typeof contexto === 'string') {
      try {
        const parsed = JSON.parse(contexto);
        claims = parsed.claims || parsed.atributos || [];
      } catch (e) {
        console.warn('[menu.controller] Error al parsear el string de contexto:', e.message);
      }
    } else if (contexto && typeof contexto === 'object') {
      claims = contexto.claims || contexto.atributos || [];
    }

    const backendUrl = process.env.BACKEND_SERVICE_URL || 'http://localhost:3205';
    const targetUrl = `${backendUrl}/api/v1/admin/menu/context`;

    console.log(`[menu.controller] Delegando consulta de menú a backend en: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ claims }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en el backend de seguridad: ${response.status} - ${errorText}`);
    }

    const menuJson = await response.json();
    res.status(200).json(menuJson);
  } catch (err) {
    console.error('[menu.controller] Error al delegar menú al backend:', err.message);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getMenuNgac };
