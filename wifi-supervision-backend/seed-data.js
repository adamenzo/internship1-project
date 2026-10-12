const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

async function seedData() {
    try {
        console.log('Seeding data...');

        // Insert sites
        await pool.execute(
            'INSERT INTO sites (nom, adresse, latitude, longitude) VALUES (?, ?, ?, ?)',
            ['Site Central', '123 Rue Principale', 34.020882, -6.841650]
        );
        console.log('Site inserted');

        // Insert APs
        const aps = [
            ['AA:BB:CC:DD:EE:01', 'AP-01', 'Cisco', '1.0', '192.168.1.1', 1, 'Bureau 101', '1er', 'Salle 1', 34.020882, -6.841650, 'actif'],
            ['AA:BB:CC:DD:EE:02', 'AP-02', 'Cisco', '1.0', '192.168.1.2', 1, 'Bureau 102', '1er', 'Salle 2', 34.020882, -6.841650, 'actif'],
            ['AA:BB:CC:DD:EE:03', 'AP-03', 'Cisco', '1.0', '192.168.1.3', 1, 'Bureau 103', '2e', 'Salle 3', 34.020882, -6.841650, 'hors_ligne']
        ];

        for (const ap of aps) {
            await pool.execute(
                'INSERT INTO points_acces (mac, nom, modele, firmware, ip_address, site_id, batiment, etage, salle, latitude, longitude, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                ap
            );
        }
        console.log('APs inserted');

        // Insert metrics for last 24 hours
        const now = new Date();
        for (let i = 0; i < 24; i++) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            for (let apId = 1; apId <= 3; apId++) {
                const clients = Math.floor(Math.random() * 20) + 1;
                const debitIn = Math.random() * 100 + 50;
                const debitOut = Math.random() * 50 + 25;
                const cpu = Math.random() * 30 + 20;
                const mem = Math.random() * 40 + 30;

                await pool.execute(
                    'INSERT INTO metriques (ap_id, timestamp, clients_connectes, debit_entrant, debit_sortant, cpu_usage, mem_usage) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [apId, timestamp, clients, debitIn, debitOut, cpu, mem]
                );
            }
        }
        console.log('Metrics inserted');

        // Insert some alerts
        await pool.execute(
            'INSERT INTO alertes (ap_id, message, severity, est_resolue) VALUES (?, ?, ?, ?)',
            [1, 'Débit entrant élevé', 'warning', false]
        );
        await pool.execute(
            'INSERT INTO alertes (ap_id, message, severity, est_resolue) VALUES (?, ?, ?, ?)',
            [3, 'AP hors ligne', 'critical', false]
        );
        console.log('Alerts inserted');

        console.log('Seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedData();