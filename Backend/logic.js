
require('dotenv').config();

const path = require('path');

const mysql = require('mysql2');

const bcrypt = require('bcryptjs');

const PDFDocument = require('pdfkit');

const PDFTable = require('pdfkit-table');

const moment = require('moment');
const session = require('express-session');

const db = mysql.createConnection({
  host: process.env.tidb_DB_HOST,
  user: process.env.tidb_DB_USER,
  password: process.env.tidb_DB_PASS,
  database: process.env.tidb_DB_NAME,
  port: process.env.tidb_DB_PORT || 4000,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});


exports.log = (req,res)=>{
console.log('gokul');

db.connect((err) => {
  if (err) {
    console.log("MySQL connection failed ❌", err);
  } else {
    console.log("Connected to local host MySQL ✅");
  }
});
}

exports.table = (req, res) => {
  console.log("table...");
  const alert = req.query.alert;

  
  const query = `SELECT * FROM clients`;

  db.query(query , (err, result) => {
    if (err) {
       console.error("Error fetching table:", err);
       return res.status(500).send("Internal Server Error");
   }
            
    if (result.length === 0) {
       return res.status(404).send("Data not found");
    }

    console.log(result);

    // Format dates
    const formattedClients = result.map(client => {
      return {
        ...client,
        fc_expiry_date: formatDate(client.fc_expiry_date),
        np: formatDate(client.np),
        permit: formatDate(client.permit),
        created_at: formatDateTime(client.created_at),
        modified_at: formatDateTime(client.modified_at),

        // yyyy-mm-dd for <input type="date">
        fc_expiry_date_input: formatYMD(client.fc_expiry_date),
        np_input: formatYMD(client.np),
        permit_input: formatYMD(client.permit)
      };
    });



    const clients = result;
    res.render('TableDesign', { clients: formattedClients, alert });
  });
} 


exports.search = (req, res) => {
  const search = req.body.search_query?.trim();

  // If no search input is provided
  if (!search) {
    return res.render("TableDesign", {
      clients: [],
      message: "Please enter a search term."
    });
  }

  // Query: wildcard for client_name, exact for phone & vehicle_number
  const query = `
    SELECT * FROM clients
    WHERE client_name LIKE ?
       OR company LIKE ?
       OR phone = ?
       OR vehicle_number = ?
  `;

  // Values: client_name with %, others exact
  const values = [`%${search}%`,`%${search}%`, search, search];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error fetching table:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (result.length === 0) {
      return res.render("TableDesign", {
        clients: [],
        message: `No results found for "${search}".`,
        s:search
      });
    }

    // Format dates
    const formattedClients = result.map(client => ({
      ...client,
      fc_expiry_date: formatDate(client.fc_expiry_date),
      np: formatDate(client.np),
      permit: formatDate(client.permit),
      created_at: formatDateTime(client.created_at),
      modified_at: formatDateTime(client.modified_at)
    }));

    res.render('TableDesign', { clients: formattedClients,
                                s:search
     });
  });
};


// exports.gr = (req, res) => {
//   const PDFDocument = require('pdfkit');
//   const moment = require('moment');
//   const { from_date, to_date, columns } = req.body;
//   const selectedColumns = Array.isArray(columns) ? columns : [columns];

//   if (!from_date || !to_date || selectedColumns.length === 0) {
//     return res.status(400).send('Invalid request');
//   }

//   const columnString = selectedColumns.map(col => `\`${col}\``).join(', ');
//   const query = `
//     SELECT ${columnString}
//     FROM clients
//     WHERE created_at BETWEEN ? AND ?
//     ORDER BY created_at ASC
//   `;

//   db.query(query, [from_date, to_date], (err, results) => {
//     if (err) {
//       console.error('MySQL Error:', err);
//       return res.status(500).send('Database Error');
//     }

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'inline; filename=client_report.pdf');

//     const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'portrait' });
//     doc.pipe(res);

//     // --- Dimensions ---
//     const marginLeft = doc.page.margins.left;
//     const marginRight = doc.page.margins.right;
//     const marginTop = doc.page.margins.top;
//     const marginBottom = doc.page.margins.bottom;

//     const usableWidth = doc.page.width - marginLeft - marginRight;
//     const usableHeight = doc.page.height - marginTop - marginBottom;

//     const sNoWidth = 40; // Narrow S.No column
//     const otherColWidth = (usableWidth - sNoWidth) / selectedColumns.length;
//     const tableTop = marginTop + 40;
//     let y = tableTop;

//     // --- Helpers ---
//     function drawCell(text, x, y, width, height, isHeader = false) {
//       doc.rect(x, y, width, height).stroke();
//       doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
//       doc.text(text, x + 5, y + 5, {
//         width: width - 10,
//         align: 'left'
//       });
//     }

//     function drawRow(data, y, isHeader = false) {
//       let x = marginLeft;

//       const cells = [
//         isHeader ? 'S.No' : data.index.toString(),
//         ...selectedColumns.map(col => {
//           if (isHeader) return col.replace(/_/g, ' ').toUpperCase();
//           const val = data[col];
//           return val instanceof Date ? moment(val).format('YYYY-MM-DD') : val || '';
//         })
//       ];

//       const cellHeights = cells.map((text, i) => {
//         const width = i === 0 ? sNoWidth : otherColWidth;
//         return doc.heightOfString(text.toString(), {
//           width: width - 10,
//           align: 'left'
//         });
//       });

//       const rowHeight = Math.max(...cellHeights) + 10;

//       cells.forEach((text, i) => {
//         const width = i === 0 ? sNoWidth : otherColWidth;
//         drawCell(text.toString(), x, y, width, rowHeight, isHeader);
//         x += width;
//       });

//       return rowHeight;
//     }

//     function calculateRowHeight(data) {
//       const cells = [
//         data.index.toString(),
//         ...selectedColumns.map(col => {
//           const val = data[col];
//           return val instanceof Date ? moment(val).format('YYYY-MM-DD') : val || '';
//         })
//       ];

//       const heights = cells.map((text, i) => {
//         const width = i === 0 ? sNoWidth : otherColWidth;
//         return doc.heightOfString(text.toString(), {
//           width: width - 10,
//           align: 'left'
//         });
//       });

//       return Math.max(...heights) + 10;
//     }

//     // --- Title ---
//     doc.fontSize(16).font('Helvetica-Bold').text('Client Report', {
//       align: 'center'
//     });
//     doc.moveDown();
//     y = tableTop;

//     // --- Header Row ---
//     const headerHeight = drawRow({}, y, true);
//     y += headerHeight;

//     // --- Data Rows ---
//     results.forEach((row, index) => {
//       const rowData = { ...row, index: index + 1 };
//       const rowHeight = calculateRowHeight(rowData);

//       if (y + rowHeight > doc.page.height - marginBottom) {
//         doc.addPage({ layout: 'portrait' });
//         y = tableTop;
//         const headerHeight = drawRow({}, y, true);
//         y += headerHeight;
//       }

//       const drawnHeight = drawRow(rowData, y);
//       y += drawnHeight;
//     });

//     doc.end();
//   });
// };

exports.gr = (req, res) => {
  const PDFDocument = require('pdfkit');
  const moment = require('moment');
  const { from_date, to_date, columns } = req.body;
  const selectedColumns = Array.isArray(columns) ? columns : [columns];

  if (!from_date || !to_date || selectedColumns.length === 0) {
    return res.status(400).send('Invalid request');
  }

  const columnString = selectedColumns.map(col => `\`${col}\``).join(', ');

  // --- Optimized ORDER BY Logic ---
  let orderBy = '';

  const dateFields = ['fc_expiry_date', 'permit', 'np'];
  const nameFields = ['client_name', 'company'];
  const selectedDateFields = dateFields.filter(field => selectedColumns.includes(field));
  const selectedNameFields = nameFields.filter(field => selectedColumns.includes(field));

  if (selectedDateFields.length === 1) {
    orderBy = `ORDER BY \`${selectedDateFields[0]}\` ASC`;
  } else if (selectedDateFields.length > 1 && selectedNameFields.length > 0) {
    orderBy = `ORDER BY ${selectedNameFields.map(f => `\`${f}\``).join(', ')} ASC`;
  } else {
    orderBy = 'ORDER BY created_at ASC';
  }

  const query = `
    SELECT ${columnString}
    FROM clients
    WHERE created_at BETWEEN ? AND ?
    ${orderBy}
  `;

  db.query(query, [from_date, to_date], (err, results) => {
    if (err) {
      console.error('MySQL Error:', err);
      return res.status(500).send('Database Error');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=client_report.pdf');

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'portrait' });
    doc.pipe(res);

    // --- Dimensions ---
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;
    const marginTop = doc.page.margins.top;
    const marginBottom = doc.page.margins.bottom;

    const usableWidth = doc.page.width - marginLeft - marginRight;
    const sNoWidth = 40;
    const otherColWidth = (usableWidth - sNoWidth) / selectedColumns.length;
    const tableTop = marginTop + 10;
    let y = tableTop;

    // --- Helpers ---
    function drawCell(text, x, y, width, height, isHeader = false) {
      doc.rect(x, y, width, height).stroke();
      doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      doc.text(text, x + 5, y + 5, {
        width: width - 10,
        align: 'left'
      });
    }

    function drawRow(data, y, isHeader = false) {
      let x = marginLeft;
      const cells = [
        isHeader ? 'S.No' : data.index.toString(),
        ...selectedColumns.map(col => {
          if (isHeader) return col.replace(/_/g, ' ').toUpperCase();
          const val = data[col];
          return val instanceof Date ? moment(val).format('YYYY-MM-DD') : val || '';
        })
      ];

      const cellHeights = cells.map((text, i) => {
        const width = i === 0 ? sNoWidth : otherColWidth;
        return doc.heightOfString(text.toString(), {
          width: width - 10,
          align: 'left'
        });
      });

      const rowHeight = Math.max(...cellHeights) + 10;

      cells.forEach((text, i) => {
        const width = i === 0 ? sNoWidth : otherColWidth;
        drawCell(text.toString(), x, y, width, rowHeight, isHeader);
        x += width;
      });

      return rowHeight;
    }

    function calculateRowHeight(data) {
      const cells = [
        data.index.toString(),
        ...selectedColumns.map(col => {
          const val = data[col];
          return val instanceof Date ? moment(val).format('YYYY-MM-DD') : val || '';
        })
      ];

      const heights = cells.map((text, i) => {
        const width = i === 0 ? sNoWidth : otherColWidth;
        return doc.heightOfString(text.toString(), {
          width: width - 10,
          align: 'left'
        });
      });

      return Math.max(...heights) + 10;
    }

    // Removed title "Client Report"
    y = tableTop;

    // --- Header Row ---
    const headerHeight = drawRow({}, y, true);
    y += headerHeight;

    // --- Data Rows ---
    results.forEach((row, index) => {
      const rowData = { ...row, index: index + 1 };
      const rowHeight = calculateRowHeight(rowData);

      if (y + rowHeight > doc.page.height - marginBottom) {
        doc.addPage({ layout: 'portrait' });
        y = tableTop;
        const headerHeight = drawRow({}, y, true);
        y += headerHeight;
      }

      const drawnHeight = drawRow(rowData, y);
      y += drawnHeight;
    });

    doc.end();
  });
};


exports.loadNotifications = (req, res) => {
  const today = moment().startOf('day');
  const targetDate = today.clone().add(7, 'days').format('YYYY-MM-DD');

  const query = `
    SELECT client_name, phone, company, vehicle_number, 
           DATE_FORMAT(fc_expiry_date, '%Y-%m-%d') as fc_expiry_date,
           DATE_FORMAT(np, '%Y-%m-%d') as np_expiry_date,
           DATE_FORMAT(permit, '%Y-%m-%d') as permit_expiry_date
    FROM clients
    WHERE fc_expiry_date = ?
       OR np = ?
       OR permit = ?
  `;

  db.query(query, [targetDate, targetDate, targetDate], (err, results) => {
    if (err) {
      console.error('Notification Fetch Error:', err);
      return res.status(500).json({ error: 'Server error while fetching notifications.' });
    }

    const notifications = results.flatMap(client => {
      const notifications = [];

      if (client.fc_expiry_date === targetDate) {
        notifications.push({
          type: 'FC',
          expiry_date: client.fc_expiry_date,
          message: `FC for Vehicle ${client.vehicle_number} is expiring in 7 days!`,
          client_name: client.client_name,
          phone: client.phone,
          vehicle_number: client.vehicle_number,
          company: client.company
        });
      }

      if (client.np_expiry_date === targetDate) {
        notifications.push({
          type: 'NP',
          expiry_date: client.np_expiry_date,
          message: `NP for Vehicle ${client.vehicle_number} is expiring in 7 days!`,
          client_name: client.client_name,
          phone: client.phone,
          vehicle_number: client.vehicle_number,
          company: client.company
        });
      }

      if (client.permit_expiry_date === targetDate) {
        notifications.push({
          type: 'Permit',
          expiry_date: client.permit_expiry_date,
          message: `Permit for Vehicle ${client.vehicle_number} is expiring in 7 days!`,
          client_name: client.client_name,
          phone: client.phone,
          vehicle_number: client.vehicle_number,
          company: client.company
        });
      }

      return notifications;
    });

    res.render('notification', { notifications }); // your handlebars page
  });
};


// WhatsApp redirect logic
exports.sendWhatsAppNotification = (req, res) => {
  const { name, phone, vehicle, company, type, date } = req.query;

  const message = `Hello ${name},\n\nThis is a reminder that your vehicle ${vehicle} (${type}) is expiring on ${date}. Please renew it on time.\n\nThank you!\n- ${company}`;
  const whatsappLink = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;

  res.redirect(whatsappLink);
};


exports.addClient = (req, res) => {
  const {
    client_name,
    phone,
    company,
    vehicle_number,
    vehicle_type,
    fc_expiry_date,
    np,
    permit,
    notes
  } = req.body;

  const checkQuery = `SELECT * FROM clients WHERE vehicle_number = ?`;
  db.query(checkQuery, [vehicle_number], (err, results) => {
    if (err) {
      console.error("Error checking vehicle:", err);
      return res.redirect('/table?alert=error');
    }

    if (results.length > 0) {
      return res.redirect('/table?alert=exists');
    }

    const insertQuery = `
      INSERT INTO clients 
      (client_name, phone, company, vehicle_number, vehicle_type, fc_expiry_date, np, permit, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      client_name,
      phone,
      company,
      vehicle_number,
      vehicle_type,
      fc_expiry_date,
      np,
      permit,
      notes
    ];

    db.query(insertQuery, values, (err, result) => {
      if (err) {
        console.error("Error inserting client:", err);
        return res.redirect('/table?alert=error');
      }

      return res.redirect('/table?alert=success');
    });
  });
};

exports.editClient = (req, res) => {
  const {
    id,
    client_name,
    phone,
    company,
    vehicle_number,
    vehicle_type,
    fc_expiry_date,
    np,
    permit,
    notes
  } = req.body;
  console.log("EDIT CLIENT HIT", req.body);


  const updateQuery = `
    UPDATE clients
    SET client_name = ?, phone = ?, company = ?, vehicle_type = ?,
        fc_expiry_date = ?, np = ?, permit = ?, notes = ?, modified_at = NOW()
    WHERE id = ?
  `;

  const values = [
    client_name,
    phone,
    company,
    vehicle_type,
    fc_expiry_date,
    np,
    permit,
    notes,
    id
  ];

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error("Error updating client:", err);
      return res.redirect('/table?alert=error');
    }

    console.log("Client updated successfully.");

    res.redirect('/table?alert=updated');
  });
};

exports.deleteClient = (req, res) => {
  const vehicleNumbers = req.body.vehicle_ids;
  console.log(vehicleNumbers);
  if (!vehicleNumbers) {
    return res.redirect('/table?alert=nodata');
  }

  const idsArray = Array.isArray(vehicleNumbers) ? vehicleNumbers : [vehicleNumbers];

  const query = `DELETE FROM clients WHERE vehicle_number IN (?)`;

  db.query(query, [idsArray], (err, result) => {
    if (err) {
      console.error("Error deleting clients:", err);
      return res.redirect('/table?alert=error');
    }

    console.log("Deleted clients:", idsArray);
    res.redirect('/table?alert=deleted');
  });
};


exports.admin = (req, res) => {
  const adminId = req.session.adminId;

  if (!adminId) {
    return res.redirect('/?alert=unauthorized');
  }

  const totalQuery = `SELECT COUNT(*) AS total FROM clients`;
  const yesterdayQuery = `SELECT COUNT(*) AS yesterday FROM clients WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY`;
  const modifiedQuery = `SELECT COUNT(*) AS modified FROM clients WHERE DATE(modified_at) = CURDATE()`;
  const allClientsQuery = `SELECT * FROM employee`;
  const adminInfoQuery = `SELECT name, email FROM admin WHERE id = ?`;

  db.query(totalQuery, (err, totalResult) => {
    if (err) return res.status(500).send("Total query error");

    db.query(yesterdayQuery, (err, yResult) => {
      if (err) return res.status(500).send("Yesterday query error");

      db.query(modifiedQuery, (err, mResult) => {
        if (err) return res.status(500).send("Modified query error");

        db.query(allClientsQuery, (err, employeeResult) => {
          if (err) return res.status(500).send("All clients query error");

          db.query(adminInfoQuery, [adminId], (err, adminInfoResult) => {
            if (err || adminInfoResult.length === 0) {
              return res.status(500).send("Admin info query error");
            }

            const stats = {
              totalClients: totalResult[0].total,
              newYesterday: yResult[0].yesterday,
              modifiedToday: mResult[0].modified,
            };

            const admin = adminInfoResult[0];

            res.render('admin', {
              stats,
              emp: employeeResult,
              adminName: admin.name,
              adminEmail: admin.email
            });
          });
        });
      });
    });
  });
};


// Small Admin Controlls Functions

exports.login = (req, res) => {
  console.log("Login requested.");
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect('/?alert=empty');
  }

  // Step 1: Try finding the user in the admin table
  const adminQuery = `SELECT * FROM admin WHERE email = ? LIMIT 1`;

  db.query(adminQuery, [email], (err, adminResult) => {
    if (err) {
      console.error("Error querying admin table:", err);
      return res.redirect('/?alert=error');
    }

    if (adminResult.length > 0) {
      const admin = adminResult[0];

      // Compare passwords (if hashed)
      bcrypt.compare(password, admin.password, (err, isMatch) => {
        if (err || !isMatch) {
          return res.redirect('/?alert=invalid');
        }

        // Login successful as admin
        req.session.userType = 'admin';
        req.session.adminId = admin.id;
        return res.redirect('/home');
      });
       
       
    } else {
      // Step 2: Try finding the user in the employee table
      const empQuery = `SELECT * FROM employee WHERE email = ? LIMIT 1`;

      db.query(empQuery, [email], (err, empResult) => {
        if (err) {
          console.error("Error querying employee table:", err);
          return res.redirect('/?alert=error');
        }

        if (empResult.length === 0) {
          return res.redirect('/?alert=notfound');
        }

        const employee = empResult[0];
        // Compare passwords (hashed)
        bcrypt.compare(password, employee.password, (err, isMatch) => {
          if (err || !isMatch) {
            return res.redirect('/?alert=invalid');
          }

          // Login successful as employee
          //console.log(employee)
          req.session.userType = 'employee';
          req.session.empId = employee.id;
          return res.redirect('/home');
        });
      });
    }
  });
};


exports.AddEmployee = (req, res) => {
  console.log("Adding Employee");

  const { emp_name, emp_email, emp_password } = req.body;

  if (!emp_name || !emp_email || !emp_password) {
    return res.redirect('/?alert=empty');
  }

  // Hash the password
  bcrypt.hash(emp_password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.redirect('/admin?add_alrt=error');
    }

    const query = `INSERT INTO employee (name, email, password) VALUES (?, ?, ?)`;

    db.query(query, [emp_name, emp_email, hashedPassword], (err, result) => {
      if (err) {
        console.error("Error adding employee:", err);
        return res.redirect('/admin?add_alrt=error');
      }

      console.log("Employee added successfully with hashed password");
      res.redirect('/admin?add_alrt=added');
    });
  });
};

exports.DeleteEmployee = (req, res) => {
  console.log("Deleting Employee");

  const email = req.body.email;

  if (!email) {
    return res.redirect('/admin?alert=noemail'); 
  }

  const query = `DELETE FROM employee WHERE email = ?`;

  db.query(query, [email], (err, result) => {
    if (err) {
      console.error("Error deleting employee:", err);
      return res.redirect('/admin?alert=error');
    }

    console.log("Deleted employee:", email);
    res.redirect('/admin?alert=deleted');
  });
};


exports.ChangePassword = (req, res) => {
  console.log("Changing password");

  const { current_password, new_password } = req.body;

  // Assuming admin is logged in and session has admin ID
  const adminId = req.session.adminId;

  if (!adminId) {
    return res.redirect('/?alert=sessionexpired');
  }

  if (!current_password || !new_password) {
    return res.redirect('/admin?alert=empty');
  }

  const query = `SELECT * FROM admin WHERE id = ? LIMIT 1`;

  db.query(query, [adminId], async (err, result) => {
    if (err) {
      console.error("Error fetching admin:", err);
      return res.redirect('/admin?alert=error');
    }

    if (result.length === 0) {
      return res.redirect('/admin?alert=notfound');
    }

    const admin = result[0];

    // Compare current password with stored one
    const match = await bcrypt.compare(current_password, admin.password);
    if (!match) {
      return res.redirect('/admin?alert=wrongcurrent');
    }

    // Encrypt and update new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    const updateQuery = `UPDATE admin SET password = ? WHERE id = ?`;

    db.query(updateQuery, [hashedNewPassword, adminId], (updateErr, updateRes) => {
      if (updateErr) {
        console.error("Error updating password:", updateErr);
        return res.redirect('/admin?alert=updatefail');
      }

      console.log("Password updated for admin ID:", adminId);
      return res.redirect('/admin?alert=updated');
    });
  });
};


exports.ChangeEmail = (req, res) => {
  console.log("Changing Email");

  const { new_email } = req.body;
  const adminId = req.session.adminId;

  // Check if the admin is logged in
  if (!adminId) {
    return res.redirect('/?alert=sessionexpired');
  }

  // Validate input
  if (!new_email) {
    return res.redirect('/admin?alert=empty');
  }

  // Update query
  const updateQuery = `UPDATE admin SET email = ? WHERE id = ?`;

  db.query(updateQuery, [new_email, adminId], (err, result) => {
    if (err) {
      console.error("Error updating admin email:", err);
      return res.redirect('/admin?alert=updatefail');
    }

    console.log("Email updated for admin ID:", adminId);
    return res.redirect('/admin?alert=emailupdated');
  });
};



exports.emp = (req,res) => {
  empID =  req.session.empId;

  if (!empID) {
    return res.redirect('/index'); // Not logged in or no session
  }

  const query = 'SELECT * FROM employee WHERE id = ?';
  db.query(query, [empID], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (results.length === 0) {
      return res.render('index',{msg:"Employee not found"});
    }

    res.render('emp', { employee: results[0] });
  });

};


// Time Formating 

// Format date to dd/mm/yyyy
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB'); // dd/mm/yyyy
}

function formatYMD(date) {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}


// Format date + time to dd/mm/yyyy hh:mm AM/PM
function formatDateTime(date) {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }); // dd/mm/yyyy, hh:mm AM/PM
}


