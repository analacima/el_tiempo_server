import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://analacima.github.io', 'https://analacima.github.io/el_tiempo'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

const API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbmEubGFjaW1hQGdtYWlsLmNvbSIsImp0aSI6ImMzYzU5ODFlLTNmOTUtNDk0MC04NGFkLWMxMWRjNDYyMTRkMCIsImlzcyI6IkFFTUVUIiwiaWF0IjoxNzQxNTQzOTQ5LCJ1c2VySWQiOiJjM2M1OTgxZS0zZjk1LTQ5NDAtODRhZC1jMTFkYzQ2MjE0ZDAiLCJyb2xlIjoiIn0.OvrYpcVXQ-O6TgoHE0kmM-UVVS1V13kLTCHuuBj4COs';

// Proxy para la predicción horaria
app.get('/api/prediccion/horaria/:municipioId', async (req, res) => {
    try {
        const { municipioId } = req.params;
        const response = await fetch(
            `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/horaria/${municipioId}?api_key=${API_KEY}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error en la API de AEMET: ${response.status}`);
        }

        const data = await response.json();

        if (data.datos) {
            const dataResponse = await fetch(data.datos);
            const weatherData = await dataResponse.json();
            res.json(weatherData);
        } else {
            throw new Error('No se encontraron datos');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy para la predicción diaria
app.get('/api/prediccion/diaria/:municipioId', async (req, res) => {
    try {
        const { municipioId } = req.params;
        const response = await fetch(
            `https://opendata.aemet.es/opendata/api/prediccion/especifica/municipio/diaria/${municipioId}?api_key=${API_KEY}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error en la API de AEMET: ${response.status}`);
        }

        const data = await response.json();

        if (data.datos) {
            const dataResponse = await fetch(data.datos);
            const weatherData = await dataResponse.json();
            res.json(weatherData);
        } else {
            throw new Error('No se encontraron datos');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const startServer = async () => {
    const ports = [3001, 3002, 3003, 3004, 3005];
    const PORT = process.env.PORT || ports[0];

    // Si estamos en Render, usa el puerto proporcionado por la plataforma
    if (process.env.PORT) {
        app.listen(PORT, () => {
            console.log(`Servidor proxy ejecutándose en el puerto ${PORT}`);
        });
        return;
    }

    // En desarrollo, intenta diferentes puertos si el principal está ocupado
    for (const port of ports) {
        try {
            await new Promise((resolve, reject) => {
                const server = app.listen(port)
                    .once('listening', () => {
                        console.log(`Servidor proxy ejecutándose en el puerto ${port}`);
                        resolve();
                    })
                    .once('error', (err) => {
                        if (err.code === 'EADDRINUSE') {
                            console.log(`Puerto ${port} en uso, intentando siguiente...`);
                            reject(err);
                        } else {
                            console.error(`Error al iniciar servidor en puerto ${port}:`, err);
                            reject(err);
                        }
                    });
            });
            break; // Si llegamos aquí, el servidor se inició correctamente
        } catch (err) {
            if (port === ports[ports.length - 1]) {
                console.error('No se pudo iniciar el servidor en ningún puerto disponible');
                process.exit(1);
            }
            // Continúa con el siguiente puerto
            continue;
        }
    }
};

startServer();
