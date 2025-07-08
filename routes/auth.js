var express = require('express');
var crypto = require('crypto'); // Needed for generating session IDs

// We need to access the sessions object from app.js.
// This is a simplification for teaching. In a larger app, you might use a shared module or context.
// For now, we'll assume `sessions` is available via `req.app.locals` or pass it around.
// However, the simplest way for this refactor is to make it a global in app.js and require app.js here,
// or re-declare it here if we want to keep routes/auth.js fully independent of app.js internals.
// Let's try to get it from app.js. This is a bit of a hack for this structure.
// A better way would be to initialize sessions in a separate module and import it in both files.

// For simplicity in this educational refactor, we will rely on the `sessions` object
// being globally available from where app.js defined it.
// This is not best practice for larger applications.
// const sessions = require('../app').sessions; // This creates a circular dependency if app requires auth.
// So, we will have to pass `sessions` from `app.js` or make it accessible globally.
// The middleware in app.js already handles attaching `req.session`.

// Hardcoded users
const users = [
  { id: 1, username: 'user1', password: 'password1' }, // Plain text passwords for teaching
  { id: 2, username: 'user2', password: 'password2' },
  { id: 3, username: 'user3', password: 'password3' },
  { id: 4, username: 'user4', password: 'password4' },
  { id: 5, username: 'user5', password: 'password5' }
];

var router = express.Router();

/** GET /login
 *
 * This route prompts the user to log in.
 *
 * The 'login' view renders an HTML form, into which the user enters their
 * username and password.  When the user submits the form, a request will be
 * sent to the `POST /login/password` route.
 *
 * @openapi
 * /login:
 *   get:
 *     summary: Prompt the user to log in using a username and password
 *     responses:
 *       "200":
 *         description: Prompt.
 *         content:
 *           text/html:
 */
router.get('/login', function(req, res, next) {
  res.render('login');
});

/** POST /login/password
 *
 * This route authenticates the user by verifying a username and password.
 *
 * A username and password are submitted to this route via an HTML form, which
 * was rendered by the `GET /login` route.  The username and password is
 * authenticated using the `local` strategy.  The strategy will parse the
 * username and password from the request and call the `verify` function.
 *
 * Upon successful authentication, a login session will be established.  As the
 * user interacts with the app, by clicking links and submitting forms, the
 * subsequent requests will be authenticated by verifying the session.
 *
 * When authentication fails, the user will be re-prompted to login and shown
 * a message informing them of what went wrong.
 *
 * @openapi
 * /login/password:
 *   post:
 *     summary: Log in using a username and password
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: number
 *     responses:
 *       "302":
 *         description: Redirect.
 */
router.post('/login/password', function(req, res, next) {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const sessionId = crypto.randomBytes(16).toString('hex');
    // We need to access the global `sessions` object defined in app.js
    // This is a simplification for this educational context.
    // `sessions` should ideally be managed in a way that doesn't rely on global scope implicitly.
    // For now, we assume app.js has made `sessions` available.
    // A better approach: req.app.locals.sessions = sessions; in app.js
    // Then here: const sessions = req.app.locals.sessions;
    // Let's modify app.js to make sessions available via req.app.locals

    const appSessions = req.app.get('sessions'); // Get sessions from app.locals

    appSessions[sessionId] = { user: { id: user.id, username: user.username } };

    res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`); // Max-Age for 1 week
    // successReturnToOrRedirect behavior:
    // For simplicity, we'll just redirect to '/'
    // The original `successReturnToOrRedirect` might use `req.session.returnTo`
    // which was managed by passport. We are not replicating that part for simplicity.
    res.redirect('/');
  } else {
    // failureRedirect and failureMessage behavior:
    // Redirect to login, perhaps with a query param for the message
    // For simplicity, just redirecting.
    // To pass a message, you could do: res.redirect('/login?error=1');
    // And then in the GET /login route, check for this query param.
    res.redirect('/login');
  }
});

/* POST /logout
 *
 * This route logs the user out.
 */
router.post('/logout', function(req, res, next) {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    const appSessions = req.app.get('sessions'); // Get sessions from app.locals
    delete appSessions[sessionId];
    res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Path=/; Expires=' + new Date(0).toUTCString());
  }
  res.redirect('/');
});

// Signup routes are removed.

module.exports = router;
