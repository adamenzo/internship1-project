require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONNEXION MYSQL 
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wifi_supervision'
}).promise();

// ========== MIDDLEWARE AUTH ==========
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non autorisé' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wifi_supervision_secret_key');
        const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) return res.status(401).json({ message: 'Utilisateur non trouvé' });
        req.user = users[0];
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ message: 'Accès refusé. Privilèges insuffisants.' });
        }
        next();
    };
};

// ========== AUTHENTIFICATION ==========
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.execute(
            'SELECT u.*, r.nom as role_nom FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
            [email]
        );
        if (users.length === 0) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        const user = users[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'wifi_supervision_secret_key', { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role_nom,
                role_id: user.role_id
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT u.*, r.nom as role_nom FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
            [req.user.id]
        );
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== GESTION DES POINTS D'ACCÈS (CRUD) ==========
// Récupérer tous les AP
app.get('/api/ap', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT a.*, s.nom as site_nom
            FROM points_acces a
            LEFT JOIN sites s ON a.site_id = s.id
            ORDER BY a.id DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Récupérer un AP par ID
app.get('/api/ap/:id', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT a.*, s.nom as site_nom
            FROM points_acces a
            LEFT JOIN sites s ON a.site_id = s.id
            WHERE a.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'AP non trouvé' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Ajouter un AP
app.post('/api/ap', authMiddleware, roleMiddleware([1, 3]), async (req, res) => {
    try {
        const { mac, nom, modele, firmware, ip_address, site_id, batiment, etage, salle, latitude, longitude, statut } = req.body;
        const [result] = await pool.execute(
            `INSERT INTO points_acces (mac, nom, modele, firmware, ip_address, site_id, batiment, etage, salle, latitude, longitude, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [mac, nom, modele, firmware, ip_address, site_id, batiment, etage, salle, latitude, longitude, statut || 'actif']
        );
        res.status(201).json({ id: result.insertId, message: 'AP ajouté' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Modifier un AP
app.put('/api/ap/:id', authMiddleware, roleMiddleware([1, 3]), async (req, res) => {
    try {
        const { mac, nom, modele, firmware, ip_address, site_id, batiment, etage, salle, latitude, longitude, statut } = req.body;
        await pool.execute(
            `UPDATE points_acces SET mac=?, nom=?, modele=?, firmware=?, ip_address=?, site_id=?, batiment=?, etage=?, salle=?, latitude=?, longitude=?, statut=?
             WHERE id=?`,
            [mac, nom, modele, firmware, ip_address, site_id, batiment, etage, salle, latitude, longitude, statut, req.params.id]
        );
        res.json({ message: 'AP mis à jour' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Supprimer un AP
app.delete('/api/ap/:id', authMiddleware, roleMiddleware([1, 3]), async (req, res) => {
    try {
        await pool.execute('DELETE FROM points_acces WHERE id = ?', [req.params.id]);
        res.json({ message: 'AP supprimé' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== SITES ==========
app.get('/api/sites', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM sites ORDER BY id');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== MÉTRIQUES ==========
// Dernières métriques pour un AP
app.get('/api/ap/:id/metrics/latest', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM metriques WHERE ap_id = ? ORDER BY timestamp DESC LIMIT 1',
            [req.params.id]
        );
        res.json(rows[0] || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Historique des métriques (pour graphiques)
app.get('/api/ap/:id/metrics/history', authMiddleware, async (req, res) => {
    const { hours = 24 } = req.query;
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM metriques WHERE ap_id = ? AND timestamp > DATE_SUB(NOW(), INTERVAL ? HOUR) ORDER BY timestamp ASC`,
            [req.params.id, hours]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== ALERTES ==========
app.get('/api/alertes', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT a.*, p.nom as ap_nom
            FROM alertes a
            JOIN points_acces p ON a.ap_id = p.id
            WHERE a.est_resolue = FALSE
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/alertes/:id/resoudre', authMiddleware, roleMiddleware([1, 3]), async (req, res) => {
    try {
        await pool.execute(
            'UPDATE alertes SET est_resolue = TRUE, resolved_at = NOW() WHERE id = ?',
            [req.params.id]
        );
        res.json({ message: 'Alerte résolue' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== NOTIFICATIONS ==========
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const [notifications] = await pool.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        const [unread] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND lue = 0',
            [req.user.id]
        );
        res.json({ notifications, unread_count: unread[0].count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/notifications/:id/lire', authMiddleware, async (req, res) => {
    try {
        await pool.execute('UPDATE notifications SET lue = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// ========== STATISTIQUES GLOBALES ==========
app.get('/api/stats/global', authMiddleware, async (req, res) => {
  try {
    // Total AP, actifs, hors ligne, maintenance
    const [totalAP] = await pool.execute('SELECT COUNT(*) as total FROM points_acces');
    const [actifs] = await pool.execute('SELECT COUNT(*) as total FROM points_acces WHERE statut = "actif"');
    const [horsLigne] = await pool.execute('SELECT COUNT(*) as total FROM points_acces WHERE statut = "hors_ligne"');
    const [maintenance] = await pool.execute('SELECT COUNT(*) as total FROM points_acces WHERE statut = "maintenance"');
    
    // Nombre total de clients connectés (somme des derniers clients par AP)
    const [clients] = await pool.execute(`
      SELECT SUM(m.clients_connectes) as total_clients
      FROM metriques m
      INNER JOIN (
        SELECT ap_id, MAX(timestamp) as max_ts
        FROM metriques
        GROUP BY ap_id
      ) latest ON m.ap_id = latest.ap_id AND m.timestamp = latest.max_ts
    `);
    
    // Débit moyen entrant/sortant sur la dernière heure
    const [debit] = await pool.execute(`
      SELECT AVG(debit_entrant) as avg_in, AVG(debit_sortant) as avg_out
      FROM metriques
      WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    
    // Alertes non résolues
    const [alertesNonResolues] = await pool.execute('SELECT COUNT(*) as total FROM alertes WHERE est_resolue = 0');
    
    res.json({
      total_aps: totalAP[0].total,
      actifs: actifs[0].total,
      hors_ligne: horsLigne[0].total,
      maintenance: maintenance[0].total,
      clients_connectes: clients[0].total_clients || 0,
      debit_entrant_moyen: debit[0].avg_in || 0,
      debit_sortant_moyen: debit[0].avg_out || 0,
      alertes_non_resolues: alertesNonResolues[0].total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ÉVOLUTION DES MÉTRIQUES (pour graphiques) ==========
app.get('/api/stats/evolution', authMiddleware, async (req, res) => {
  const { period = 'day' } = req.query; // day, week, month
  let interval;
  switch (period) {
    case 'week': interval = '7 DAY'; break;
    case 'month': interval = '30 DAY'; break;
    default: interval = '1 DAY';
  }
  try {
    const [rows] = await pool.execute(`
      SELECT 
        DATE(timestamp) as date,
        HOUR(timestamp) as hour,
        AVG(clients_connectes) as avg_clients,
        AVG(debit_entrant) as avg_debit_in,
        AVG(debit_sortant) as avg_debit_out,
        AVG(cpu_usage) as avg_cpu,
        AVG(mem_usage) as avg_mem
      FROM metriques
      WHERE timestamp > DATE_SUB(NOW(), INTERVAL ${interval})
      GROUP BY DATE(timestamp), HOUR(timestamp)
      ORDER BY timestamp ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ========== STATISTIQUES GLOBALES ==========
app.get('/api/stats/global', authMiddleware, async (req, res) => {
  try {
    const [totalAP] = await pool.execute('SELECT COUNT(*) as total FROM points_acces');
    const [actifs] = await pool.execute('SELECT COUNT(*) as total FROM points_acces WHERE statut = "actif"');
    const [horsLigne] = await pool.execute('SELECT COUNT(*) as total FROM points_acces WHERE statut = "hors_ligne"');
    const [maintenance] = await pool.execute('SELECT COUNT(*) as total FROM points_acces WHERE statut = "maintenance"');
    
    const [clients] = await pool.execute(`
      SELECT SUM(m.clients_connectes) as total_clients
      FROM metriques m
      INNER JOIN (
        SELECT ap_id, MAX(timestamp) as max_ts
        FROM metriques
        GROUP BY ap_id
      ) latest ON m.ap_id = latest.ap_id AND m.timestamp = latest.max_ts
    `);
    
    const [debit] = await pool.execute(`
      SELECT AVG(debit_entrant) as avg_in, AVG(debit_sortant) as avg_out
      FROM metriques
      WHERE timestamp > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    
    const [alertesNonResolues] = await pool.execute('SELECT COUNT(*) as total FROM alertes WHERE est_resolue = 0');
    
    res.json({
      total_aps: totalAP[0].total,
      actifs: actifs[0].total,
      hors_ligne: horsLigne[0].total,
      maintenance: maintenance[0].total,
      clients_connectes: clients[0].total_clients || 0,
      debit_entrant_moyen: debit[0].avg_in || 0,
      debit_sortant_moyen: debit[0].avg_out || 0,
      alertes_non_resolues: alertesNonResolues[0].total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========== ÉVOLUTION DES MÉTRIQUES ==========
app.get('/api/stats/evolution', authMiddleware, async (req, res) => {
  const { period = 'day' } = req.query;
  let interval;
  switch (period) {
    case 'week': interval = '7 DAY'; break;
    case 'month': interval = '30 DAY'; break;
    default: interval = '1 DAY';
  }
  try {
    const [rows] = await pool.execute(`
      SELECT 
        DATE(timestamp) as date,
        HOUR(timestamp) as hour,
        AVG(clients_connectes) as avg_clients,
        AVG(debit_entrant) as avg_debit_in,
        AVG(debit_sortant) as avg_debit_out,
        AVG(cpu_usage) as avg_cpu,
        AVG(mem_usage) as avg_mem
      FROM metriques
      WHERE timestamp > DATE_SUB(NOW(), INTERVAL ${interval})
      GROUP BY DATE(timestamp), HOUR(timestamp)
      ORDER BY timestamp ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    res.json({ message: 'API WiFi Supervision opérationnelle', timestamp: new Date() });
});

// ========== DÉMARRAGE ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur WiFi démarré sur http://localhost:${PORT}`);
    console.log('   POST   /api/auth/login');
    console.log('   CRUD   /api/ap');
    console.log('   GET    /api/sites');
    console.log('   GET    /api/alertes');
    console.log('   GET    /api/notifications');
});