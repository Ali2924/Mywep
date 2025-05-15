const SPREADSHEET_ID = '1pxtMn4SznVh6b88R19-xuWhB4_zYKINwODT-pcQ7ZY4'; // Replace with your actual Spreadsheet ID
const SHEET_NAME = 'users';
const HEADERS = ['اسم المستخدم', 'كلمة المرور', 'الاسم كاملا', 'البريد الالكتروني'];

function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Processes the login request.
 * @param {Object} formData - An object containing username and password.
 * @returns {Object} - An object indicating success or failure.
 */
function processLogin(formData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    // Find header row (assuming it's the first row)
    const headerRow = data[0];
    const usernameCol = headerRow.indexOf(HEADERS[0]);
    const passwordCol = headerRow.indexOf(HEADERS[1]);

    if (usernameCol === -1 || passwordCol === -1) {
        return { success: false, message: 'أعمدة اسم المستخدم أو كلمة المرور غير موجودة في الورقة.' };
    }

    // Start from the second row to skip headers
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sheetUsername = row[usernameCol];
      const sheetPassword = row[passwordCol];

      if (sheetUsername === formData.username && sheetPassword === formData.password) {
        return { success: true }; // Login successful
      }
    }

    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' }; // Login failed

  } catch (e) {
    Logger.log(e);
    return { success: false, message: 'حدث خطأ في الخادم: ' + e.message };
  }
}

/**
 * Processes the create account request.
 * @param {Object} formData - An object containing new user data.
 * @returns {Object} - An object indicating success or failure.
 */
function processCreateAccount(formData) {
    try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName(SHEET_NAME);
         const data = sheet.getDataRange().getValues();

        // Find header row
        const headerRow = data[0];
        const usernameCol = headerRow.indexOf(HEADERS[0]);
        const passwordCol = headerRow.indexOf(HEADERS[1]);
        const fullNameCol = headerRow.indexOf(HEADERS[2]);
        const emailCol = headerRow.indexOf(HEADERS[3]);

         if (usernameCol === -1 || passwordCol === -1 || fullNameCol === -1 || emailCol === -1) {
            return { success: false, message: 'تأكد من وجود جميع الأعمدة المطلوبة (اسم المستخدم، كلمة المرور، الاسم كاملا، البريد الالكتروني).' };
        }

        // Check if username or email already exists (basic check)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[usernameCol] === formData.username) {
                return { success: false, message: 'اسم المستخدم موجود بالفعل.' };
            }
             if (row[emailCol] === formData.email) {
                return { success: false, message: 'البريد الإلكتروني موجود بالفعل.' };
            }
        }


        // Append new user data to the sheet
        const newRow = [];
        newRow[usernameCol] = formData.username;
        newRow[passwordCol] = formData.password; // **UNSECURE** - See note above
        newRow[fullNameCol] = formData.fullName;
        newRow[emailCol] = formData.email;

        // Ensure the row has enough columns to match the sheet
        while(newRow.length < headerRow.length) {
            newRow.push('');
        }


        sheet.appendRow(newRow);

        return { success: true };

    } catch (e) {
        Logger.log(e);
        return { success: false, message: 'حدث خطأ في الخادم أثناء إنشاء الحساب: ' + e.message };
    }
}

/**
 * Processes the forgot password request.
 * (Sends an email with the password if found - INSECURE)
 * @param {Object} formData - An object containing the recovery email.
 * @returns {Object} - An object indicating success or failure.
 */
function processForgotPassword(formData) {
     try {
        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const sheet = ss.getSheetByName(SHEET_NAME);
        const data = sheet.getDataRange().getValues();

         // Find header row
        const headerRow = data[0];
        const emailCol = headerRow.indexOf(HEADERS[3]);
        const passwordCol = headerRow.indexOf(HEADERS[1]); // Get password column index

         if (emailCol === -1) {
            return { success: false, message: 'عمود البريد الإلكتروني غير موجود في الورقة.' };
        }
        if (passwordCol === -1) {
             return { success: false, message: 'عمود كلمة المرور غير موجود في الورقة.' };
        }


        let emailFound = false;
        let userPassword = ''; // Variable to store the password

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[emailCol] === formData.email) {
                emailFound = true;
                userPassword = row[passwordCol]; // Get the password
                break;
            }
        }

        if (emailFound) {
            // ** SECURITY WARNING: Sending passwords via email is NOT secure. **
            // A real implementation should use password reset links.
            try {
                 MailApp.sendEmail(
                     formData.email, // Recipient email
                     "استعادة كلمة المرور لحسابك", // Subject
                     "كلمة المرور الخاصة بك هي: " + userPassword + "\n\n" + // Body
                     "الرجاء تغيير كلمة المرور هذه بعد تسجيل الدخول لأسباب أمنية.\n" +
                     "ملاحظة هامة: هذه الطريقة غير آمنة. يفضل استخدام روابط إعادة تعيين كلمة المرور."
                 );
                 return { success: true, message: 'إذا كان البريد الإلكتروني مسجلاً، فسيتم إرسال كلمة المرور إليه.' };
            } catch (emailError) {
                 Logger.log("Error sending email: " + emailError);
                 return { success: false, message: 'تم العثور على البريد الإلكتروني ولكن فشل إرسال البريد: ' + emailError.message };
            }

        } else {
            return { success: false, message: 'البريد الإلكتروني غير مسجل.' };
        }

    } catch (e) {
        Logger.log(e);
        return { success: false, message: 'حدث خطأ في الخادم أثناء الاستعادة: ' + e.message };
    }
}
