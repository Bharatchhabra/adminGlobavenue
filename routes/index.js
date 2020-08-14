var ip = require('ip');
var md5	= require('md5');
var ejs = require('ejs');
const multer = require('multer');
var moment = require('moment');
const mongoose 	= require("mongoose");
var express = require('express');
var flash = require('req-flash');
const sgMail = require('@sendgrid/mail');
const session = require('express-session');
var csv = require('csv-express');

var router = express.Router();

router.use(session({ 
	secret: 'somerandonstuffs',
	resave: false,
	saveUninitialized: false,
	cookie: { expires: 6000000 }
}));

router.use(flash());

var webEmail = process.env.WEBEmail;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const clientUrl = process.env.clientUrl;

const Admin = mongoose.model("Admin")
const Users = mongoose.model("Users")
const Forgotpass = mongoose.model("Forgotpass")

const RoleModel = mongoose.model("Role")
const PlanModel = mongoose.model("Plan")
const Realestate = mongoose.model("Realestate")
const SpaceModel = mongoose.model("Space_attribute")
const purposeModel = mongoose.model("Purpose_attribute")
const automobileModel = mongoose.model("Automobile")
const boatsModel = mongoose.model("Boats")
const globtechModel = mongoose.model("Globtech")
const aboutModel = mongoose.model("About")
const PrivacyPolicyModel = mongoose.model("Privacy_policy")
const termsOfServiceModel = mongoose.model("Terms_of_service")
const contactusModel = mongoose.model("Contactus")
const faqModel = mongoose.model("Faq")
const viewerModel = mongoose.model("Viewer_user")
const helpModel = mongoose.model("Help")
const countryModel = mongoose.model("Country")
const cityModel = mongoose.model("City")
const abuseModel = mongoose.model("Abuse")
const Sendemail_list = mongoose.model("Sendemail_list")


/* SET STORAGE MULTER*/ 
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public/uploads')
	},
	filename: function (req, file, cb) {
		var fileExtension = file.originalname.split('.');
		cb(null, `${file.fieldname}-${Date.now()}.${fileExtension[fileExtension.length - 1]}`);
	}
})
 var upload = multer({ storage: storage })

/* Login url */
router.get('/', function(req, res, next) {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId){				
		res.redirect('/dashboard');		
	}
	else
	{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
});

/* Login url */
router.get('/login', function(req, res, next) {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId){	
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect('/dashboard');		
	}
	else{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}		
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
});

/* Login */
router.post('/login', async (req, res, next) => {
	var username = req.body.username;
	var password = md5(req.body.password);
	var redirecturl = req.body.redurl;
	if(username != '' && password != '')
	{
		var admin_details = await Admin.find({ $and : [ {"email": username }, {"password": password}]}, {"_id":1, "username":1, "email":1, "role":1})
		
		var logintime = new Date().getTime();
		if(admin_details.length > 0)
		{
			req.session.emailId = admin_details[0].email;
			req.session.admin_name = admin_details[0].username;
			req.session.admin_id = admin_details[0]._id;	
			req.session.adminrole = admin_details[0].role;	
			
			const admin_data = await Admin.update(
				{_id : admin_details[0]._id },
				{$set : {login_time : logintime}}
			);
			
			if(redirecturl)
			{						
				req.flash('type', 'Success');
				req.flash('text_msg', 'Login success');				
				res.redirect('/'+redirecturl);						
			}
			else
			{
				req.flash('type', 'Success');
				req.flash('text_msg', 'Login success');
				res.redirect('/dashboard');										
			}
		}	
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Email and password are not match'
			}			
			res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
		}
	}
	else if(username == ''){
		var notification_arr = {
			'type': 'Error',
			'text_msg': 'Email field is require*'
		}
		
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
	else if(password == ''){
		var notification_arr = {
			'type': 'Error',
			'text_msg': 'Password field is require*'
		}
		
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
	}
	else{
		res.redirect('/');	
	}		
});


/* forgot password */
router.get("/forgot_password", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}		
		res.render('forgotpass', { title: 'Forgot password', menuId: 'Forgot password', msg: notification_arr, redirecturl: ''});		
	}
});

/* @router for forgot password */
router.post("/forgot_password", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{		
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		var adminemail = req.body.username;
		if(adminemail != '')
		{
			const post = await Admin.findOne({"email": adminemail});
			if(post != '')
			{
				var mailOptions = {
					from: webEmail,
					to: adminemail,
					subject: 'Forgot password',
					html: '<p>Dear <b>'+post.username+',</b></p>'+
						'<p>Someone (hopefully you) requested a password reset at '+clientUrl+'</p>'+
						'<p>To reset your password, please follow the following link: '+clientUrl+'/resetpw/'+post._id+'</p>'+
						'<p>Thank you,<br>Binance Exchange</p>'
				};
				sgMail.send(mailOptions);
				
				const passdetails = new Forgotpass();
				passdetails.user_id = post._id;
				passdetails.email = adminemail;
				passdetails.to_time = new Date().getTime() + (15 * 60 * 1000);
				passdetails.created_at = moment().format("ll"); 
				passdetails.updated_at = moment().format("ll"); 
				
				await passdetails.save();
				req.flash('type', 'Success');
				req.flash('text_msg', 'Please check your email, got a link');
				res.redirect("/login");
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Not record found'
				}
				res.render('forgotpass', { title: 'Forgot password', menuId: 'Forgot password', msg: notification_arr, redirecturl: ''});		
			}
		}
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Email field is require**'
			}
			res.render('forgotpass', { title: 'Forgot password', menuId: 'Forgot password', msg: notification_arr, redirecturl: ''});		
		}		
	}
})

/* resetpassword */
router.get("/resetpw/:postId", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		var nowtime = new Date().getTime();
		const linkresult = await Forgotpass.findOne({ $and: [ {user_id: req.params.postId}, {to_time: {$gte: nowtime}} ]});
		if(linkresult != '')
		{
			try{
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}				
				res.render('resetpassword', { title: 'Reset password', menuId: 'Resetpassword', msg: notification_arr, redirecturl: '', adminId: req.params.postId});
			}
			catch(e)
			{
				res.status(500);
			}
		}
		else
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': 'Link has been expired**'
			}
			
			res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: ''});
		}
	}
})

/* Change passsword */
router.post("/resetpw/:postId", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		req.flash('type', 'Warning');
		req.flash('text_msg', 'You are logged in!');
		res.redirect("/dashboard");
	}
	else
	{
		try{
			const post = await Admin.update(
				{ _id : req.params.postId},
				{ $set : {password : md5(req.body.password)}}
			);
			req.flash('type', 'Success');
			req.flash('text_msg', 'Password reset successful');
			res.redirect('/login');
		}
		catch(e)
		{
			res.status(500);
		}
	}
});


/* Admin adminaccess */
router.get("/adminaccess", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			const admins_arr = await Admin.find({ $and : [
				{"email": {$ne : "admin@admin.com"}}, {"email": {$ne : emailId}} 
			]});
			console.log('admins_arr :', admins_arr);
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('adminaccess_role', { title: 'Admin role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, admins_list: admins_arr, adminpermition: adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});


/* create New Admin Access */
router.get("/register", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'register'});
	}
});


/* Insert data of admin details */
router.post("/register", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			var pass = req.body.password;
			var conf_pass = req.body.conf_password;
			var username = req.body.username;
			var email = req.body.email;
			
			if(pass != '' && conf_pass != '' && username != '' && email != '')
			{
				const checkusername = await Admin.find({"username": username});
				if(checkusername.length > 0)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'this username already exists'
					}
					res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });		
				}
				const checkemail = await Admin.find({"email": email});
				if(checkemail.length > 0)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'this email already exists'
					}
					res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });		
				}
				if(pass == conf_pass)
				{
					try
					{
						const post = new Admin();
						post.username = req.body.username;
						post.email = req.body.email;
						post.password = md5(req.body.password);
						post.role = req.body.role;
						post.status = true;
						post.created_at = moment().format("ll"); 
						post.updated_at = moment().format("ll"); 
						
						await post.save();
						
						var mailOptions = {
							from: webEmail,
							to: email,
							subject: 'Account successfully created | On GlobeAvenue',
							html: '<p>Dear <b>'+username+',</b></p><p>Your account successful added at GlobeAvenue</p><p>Email: '+email+'<br>Password: '+pass+'</p><p>thanks and regards,<br>Globe Avenue</p>'
						};
	
						sgMail.sendMultiple(mailOptions);
						req.flash('type', 'Success');
						req.flash('text_msg', 'Details are stored successful');
						res.redirect("/adminaccess");
					}
					catch(error)
					{
						var notification_arr = {
							'type': 'Error',
							'text_msg': error
						}
						res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition});		
					}			
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'Password and confirm password must be same!'
					}
					res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });		
				}			
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Fill are all required field*'
				}
				res.render('admin_register', { title: 'Sub Admin Details', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition});		
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'register'});
	}
});

/* Edit admin access role */
router.get("/editdetails/:postID", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			try
			{
				const post = await Admin.findOne({_id: req.params.postID});
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('editadminrole', { title: 'Admin role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, editadmin_details: post, adminpermition: adminpermition });					
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});

/* Update admin access role */
router.post("/editdetails/:postID", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			try
			{			
				await Admin.update({ _id : req.params.postID},{ $set : {role : req.body.role}});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/adminaccess");
			}
			catch(error)
			{
				const admins_arr = await Admin.find({ $and : [
					{"email": {$ne : "admin@admin.com"}}, {"email": {$ne : emailId}}
				]});
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('adminaccess_role', { title: 'Admin role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, admins_list: admins_arr, adminpermition: adminpermition });		
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});

/*  Delete Schema responce */
router.delete('/removeadmin/:postId', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try
		{
			const post = await Admin.findByIdAndRemove({_id: req.params.postId},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});


/* dashboard  details functionaliy */
router.get('/dashboard', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);

		var registered_users = await Users.find().count();
		var Professional_count = await Users.find({"role":1}).count();
		var individual_count = await Users.find({"role":2}).count();
		Users.count(function(error, user_cont) {
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('index', { title: 'Dashboard', menuId: 'Dashboard', msg: notification_arr, adminname:admin_name, user_cont: user_cont, Professional_count : Professional_count, registered_users : registered_users, individual_count : individual_count, adminpermition: adminpermition,});					
		});
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'dashboard'});
	}
});

/* User Management */
router.get("/usermanagement", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			const users_list = await Users.find().sort({"updated_at": -1});
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('usermanagement', { title: 'User Management', menuId: 'usermanagement', msg: notification_arr,  users_list: users_list, adminname:admin_name, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'usermanagement'});
	}
});

/* User data json */
router.post("/userslist", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{				
		var findemail = req.body.id;
		var findtype = req.body.type;
		var findstatus = req.body.status;
		var findsubscribe = req.body.subscribe;

		// const admins_arr = await Admin.find({ $and : [
		// 	{"email": {$ne : "admin@admin.com"}}, {"email": {$ne : emailId}} 
		// ]});

		if(findsubscribe == '' && findemail == ''  && findstatus != '' && findtype != '')
		{
			const users_result = await Users.find( {$and:[ {'role': findtype}, {'status': findstatus}]}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else if(findsubscribe == '' && findemail == ''  && findstatus == '' && findtype != '')
		{
			const users_result = await Users.find({'role': findtype}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else if(findsubscribe == '' && findemail == ''  && findstatus != '')
		{
			const users_result = await Users.find({'status': findstatus}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}

		else if(findsubscribe != '' && findemail == '')
		{
			const users_result = await Users.find({'user_type': findsubscribe}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else if(findemail != '' && findsubscribe != '')
		{
			const users_result = await Users.find({ $or : [{ 'phone': new RegExp(findemail, 'i') }, { 'contact_name': new RegExp(findemail, 'i') }, {'user_type': findsubscribe} ]}).sort({"created_on": -1});
			if(users_result.length > 0)
			{
				ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
				if (err) {
						console.log(err);
					} else {
						
						res.json(data);
					}
				});									
			}
			else
			{
				res.json('');
			}
		}
		else
		{
			const users_result = await Users.find({}).limit(10).sort({"created_on": -1});
			ejs.renderFile(process.cwd() + "/views/userslist.ejs", {users_list: users_result }, function (err, data) {
			if (err) {
					console.log(err);
				} else {
					
					res.json(data);
				}
			});				
		}
		
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'users'});
	}
});

/* Delete Users Schema responce */
router.delete('/removeuser/:postId', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try{
			const post = await Users.findByIdAndRemove({
				_id: req.params.postId
			},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});

/* user Block & Unblock functionaliy */
router.post('/userBlockUnblock', async (req, res) => {
	var type = req.body.type;
	var data = req.body.uId;
	
	var id_array = data.split(",");
	var status = '';
	if(type == 'block')
	{
		status = true;
	}
	else
	{
		status = false;
	}
	const blockUnblock = await Users.updateMany({_id : id_array},
		{$set : {status : status}
	});
	res.redirect('/usermanagement');
	return;
});


/* Get Add New Users */
router.get("/addNewUser", async (req, res,) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			let role = await RoleModel.find({});
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name, role: role, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'addNewUser'});
	}
});

/* Post Add New Users */
router.post("/addNewUser", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin'))
		{
			var email = req.body.email;
			var phone = req.body.phone;
			var pass = req.body.password;
			var location = req.body.location;
			var username = req.body.username;
			var conf_pass = req.body.conf_password;
			var role = req.body.role;
			
			if(email != '' && phone != '' && location != '' && pass != '' && conf_pass != '')
			{
				const checkusername = await Users.find({"username": username});
				if(checkusername.length > 0)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'this username already exists'
					}
					res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition});
				}
				const checkemail = await Users.find({"email": email});
				if(checkemail.length > 0)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'this email already exists'
					}
					res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition});
				}
				if(pass == conf_pass)
				{
					try
					{
						const userData = new Users();
						userData.username = req.body.username;
						userData.email = req.body.email;
						userData.location = req.body.location;
						userData.phone = req.body.phone;
						userData.password = req.body.password;
						userData.role = '1',
						userData.created_at = moment().format("ll"); 
						userData.updated_at = moment().format("ll"); 
	
						await userData.save();
	
						// var mailOptions = {
						// 	from: webEmail,
						// 	to: email,
						// 	subject: 'Account successfully created | On GlobeAvenue',
						// 	html: '<p>Dear <b>'+username+',</b></p><p>Your account successful added at globeavenue</p><p>Email: '+email+'<br>Password: '+pass+'</p><p>thanks and regards,<br>globeavenue team</p>'
						// };
	
						// sgMail.sendMultiple(mailOptions);
	
						req.flash('type', 'Success');
						req.flash('text_msg', 'User created successfully');
						res.redirect("/usermanagement");
	
						
					}
					catch(error)
					{
						var notification_arr = {
							'type': 'Error',
							'text_msg': error
						}
						res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition});
					}
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'Password and confirm password must be same!'
					}
				}
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Fill are all required field*'
				}
				res.render('addNewUser', { title: 'add_New_User', menuId: 'usermanagement', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'addNewUser'});
	}
});

/* Get viewerUsers functionaliy */
router.get("/viewerusers", async (req, res) => {
	
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const viewer_list = await viewerModel.find().sort({"created_at": -1});
			console.log('Viewer List', viewer_list);
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('viewerusers', { title: 'Viewer Users', menuId: 'viewerusers', msg: notification_arr, viewer_list: viewer_list, adminname: admin_name, adminpermition: adminpermition});
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'viewerusers'});
	} 
});

/* Delete Viewer Users functionaliy */
router.delete('/removeViewerUsers/:postId', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		try
		{
			const post = await viewerModel.findByIdAndRemove({_id: req.params.postId}, function(err) {
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'adminaccess'});
	}
});


/* Get realestate functionaliy */
router.get("/realestate", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const realestate_result = await Realestate.find({}).sort({updated_at: -1});
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('realestate', { title: 'Advertiser', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, realestate_result: realestate_result, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
	}
});

/* Add Realestate functionaliy */
router.get("/post_realestate", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const purpose_result = await purposeModel.find({});
			const space_result = await SpaceModel.find({});
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('post_realestate', { title: 'Advertiser', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, purpose_result: purpose_result, space_result: space_result, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
	}
});

/* post_realestate function */
router.post("/post_realestate", upload.single('video'),async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	const videos = req.file;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const post = new Realestate();
				post.category = req.body.category;
				post.name = req.body.name;
				post.mobile = req.body.mobile;
				post.email = req.body.email;
				post.keywords = req.body.keywords;
				post.description = req.body.description;
				post.address = req.body.address;
				post.type = req.body.type;
				post.purpose = req.body.purpose;
				post.time_of_avaliability = req.body.avaliability;
				post.type_of_space = req.body.type_of_space;
				post.square_feet = req.body.square_feet;
				post.location = req.body.location;
				post.no_of_bathrooms = req.body.no_of_bathrooms;
				post.residential_or_holiday = req.body.resedential;
				post.condition = req.body.condition;
				post.lift = req.body.lift;
				post.currency = req.body.currency;
				post.Price = req.body.price;
				post.rent_price = req.body.rent_price;
				post.monthly_charges = req.body.monthly_charges;
				post.level = req.body.level;
				post.amenities = req.body.amenities;
				post.status = false;
				post.payment_status = false;
				post.created_at = moment().format("ll"); 
				post.updated_at = moment().format("ll"); 
	
				if(req.file)
				{
					if(req.body.category != '' && req.body.name != '' && req.body.mobile != '' && req.body.email != '' && req.body.address != '')
					{
						post.video_url = videos.filename;
						await post.save();
	
						req.flash('type', 'Success');
						req.flash('text_msg', 'Details are stored successful');
						res.redirect('/realestate');
					}
					else
					{
						var notification_arr = {
							'type': 'Error',
							'text_msg': 'Category and Name and Mobile Number and Email and Address and description'
						}
						res.render('post_realestate', { title: 'Post Advertiser', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition});
					}
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'Upload Video'
					}
					res.render('post_realestate', { title: 'Post Advertiser', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition});
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
	}
});


/* Edit Realestate details */
router.get("/editRealestate/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const editrealestate = await Realestate.findOne({_id: req.params.postID});
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('edit_realestate', { title: 'Edit Reale State', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, editrealestate: editrealestate, adminpermition: adminpermition});
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('edit_realestate', { title: 'Edit Realestate', menuId: 'advertiser', msg: notification_arr, redirecturl: 'realestate', adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
	}
});

/* update realestate Details */
router.post("/editRealestate/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const edit_realestate = await Realestate.findOne({_id: req.params.postID});
			try
			{
				const post = await Realestate.update({_id : req.params.postID},
					{$set : {
						mobile : req.body.mobile,
						keywords: req.body.keywords,
						description: req.body.description,
						address: req.body.address,
						type: req.body.type,
						purpose: req.body.purpose,
						avaliability: req.body.avaliability,
						type_of_space: req.body.type_of_space,
						square_feet: req.body.square_feet,
						location: req.body.location,
						no_of_bathrooms: req.body.no_of_bathrooms,
						no_of_bedrooms: req.body.no_of_bedrooms,
						resedential: req.body.resedential,
						condition: req.body.condition,
						garage_included: req.body.garage_included,
						lift: req.body.lift,
						currency : req.body.currency,
						price : req.body.price,
						rent_price : req.body.rent_price,
						monthly_charges : req.body.monthly_charges,
						level : req.body.level,
						amenities : req.body.amenities,
						status: req.body.status,
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/realestate");
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('edit_realestate', { title: 'Edit Reale State', menuId: 'advertiser', msg: notification_arr, redirecturl: 'realestate', adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
	}
});

/* Realestate Details */
router.get("/realestateDetails/:postId", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const realestate_arr = await Realestate.findOne({_id: req.params.postId});
				if(realestate_arr != '')
				{
					var notification_arr = {
						'type': req.flash('type'),
						'text_msg': req.flash('text_msg')
					}
					res.render('realestateDetails', { title: 'Advertiser Details', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, realestate_arr: realestate_arr, adminpermition: adminpermition});
				}
				else
				{
					const realestate_result = await Realestate.find({}).sort({updated_at: -1});
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'User details not found'
					}
					res.render('realestate', { title: 'Advertiser', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, realestate_result: realestate_result, adminpermition: adminpermition});
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('realestateDetails', { title: 'Advertiser Details', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, realestate_arr: realestate_arr, adminpermition: adminpermition});
				//res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
	}
});

/* Delete Schema for Reale state responce */
router.delete('/remove_realestate/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try
		{
			const post = await Realestate.findByIdAndRemove({_id: req.params.postId}, function(err){
				if(err)
				{
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'realestate'});
	}
});

/* user Block Unblock RealEstate functionaliy */
router.post('/userBlockUnblockRealEstate', async (req, res) => {
	var type = req.body.type;
	var data = req.body.uId;
	
	var id_array = data.split(",");
	var status = '';
	if(type == 'block')
	{
		status = true;
	}
	else
	{
		status = false;
	}
	const blockUnblock = await Realestate.updateMany({_id : id_array},
		{$set : {status : status}
	});
	res.redirect('/realestate');
	return;
});


/* spaceAttributes */
router.get("/spaceAttributes", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const space_result = await SpaceModel.find({}).sort({updated_at: -1});
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('space_attributes', { title: 'Space Attributes', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, space_result: space_result, adminpermition: adminpermition})
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'spaceAttributes'});
	}
});

router.post("/spaceAttributes", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const post = new SpaceModel();
				post.name = req.body.space;
				post.status = true;
				post.created_at = moment().format("ll"); 
				post.updated_at = moment().format("ll"); 
				
				if(req.body.space != '')
				{
					await post.save();
	
					req.flash('type', 'Success');
					req.flash('text_msg', 'Space Attributes Add successful');
					res.redirect('/spaceAttributes');
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'Select Space Attributes'
					}
					res.render('space_attributes', { title: 'Space Attributes', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition})
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('space_attributes', { title: 'Space Attributes', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });
				//res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'spaceAttributes'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'spaceAttributes'});
	}
});

/* Get Edit space Attributes details */
router.get("/editSpace/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const edit_space = await SpaceModel.findOne({_id: req.params.postID});
			try
			{
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('editspace', { title: 'Edit Space', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, edit_space: edit_space, adminpermition: adminpermition });			
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('editspace', { title: 'Edit Space', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, edit_space: edit_space, adminpermition: adminpermition });			
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'spaceAttributes'});
	}
});

/* Post Edit space Attributes details */
router.post("/editSpace/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const edit_space = await SpaceModel.findOne({_id: req.params.postID});
			try
			{
				var name = req.body.name;
				var status = req.body.status;
				
				const post = await SpaceModel.update({ _id : req.params.postID},
					{ $set : {name: name, status: status}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Space details update successful');
				res.redirect('/spaceAttributes');			
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('editspace', { title: 'Edit Space', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, edit_space: edit_space, adminpermition: adminpermition });			
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'spaceAttributes'});
	}
});

/* Delete Schema for space Attributes */
router.delete('/remove_space/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId
	if(emailId)
	{
		try
		{
			const post = await SpaceModel.findByIdAndRemove({_id: req.params.postId}, function(err){
				if(err)
				{
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'spaceAttributes'});
	}
});


/* puroseAttributes */
router.get("/puroseAttributes", async (req, res) => {
	console.log('call spaceAttributes');
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const purpose_result = await purposeModel.find({}).sort({updated_at: -1});
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('purpose_attributes', { title: 'Purose Attributes', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, purpose_result: purpose_result, adminpermition: adminpermition})
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'puroseAttributes'});
	}
});


router.post("/purposeAttributes", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const post = new purposeModel();
				post.purpose = req.body.purpose;
				post.status = true;
				post.created_at = moment().format("ll"); 
				post.updated_at = moment().format("ll"); 
				
				if(req.body.purpose != '')
				{
					await post.save();
	
					req.flash('type', 'Success');
					req.flash('text_msg', 'Purpose Attributes Add successful');
					res.redirect('/puroseAttributes');
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'Select purose Attributes'
					}
					res.render('purose_attributes', { title: 'Purose Attributes', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition })
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('purpose_attributes', { title: 'Purpose Attributes', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'puroseAttributes'});
	}
});

/* Get Edit space Attributes details */
router.get("/editPurpose/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const edit_purpose = await purposeModel.findOne({_id: req.params.postID});
			try
			{
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('editpurpose', { title: 'Edit Purpose', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, edit_purpose: edit_purpose, adminpermition: adminpermition });			
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('editpurpose', { title: 'Edit Purpose', menuId: 'advertiser', msg: notification_arr, adminname: admin_name, edit_purpose: edit_purpose, adminpermition: adminpermition });			
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'puroseAttributes'});
	}
});

/* Post Edit space Attributes details */
router.post("/editPurpose/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const edit_purpose = await purposeModel.findOne({_id: req.params.postID});
			try
			{
				var purpose = req.body.purpose;
				var status = req.body.status;
				
				const post = await purposeModel.update({ _id : req.params.postID},
					{ $set : {purpose: purpose, status: status}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Purpose details update successful');
				res.redirect('/puroseAttributes');			
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('editpurpose', { title: 'Edit Purpose', menuId: 'advertiser', msg: notification_arr, adminname:admin_name, edit_purpose: edit_purpose, adminpermition: adminpermition });			
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'puroseAttributes'});
	}
});

/* Delete Schema for space Attributes */
router.delete('/remove_purpose/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId
	if(emailId)
	{
		try
		{
			const post = await purposeModel.findByIdAndRemove({_id: req.params.postId}, function(err){
				if(err)
				{
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'spaceAttributes'});
	}
});

/* ------------------------------End of RealeState Functionaliy------------------------- */

/* Automobile functionaliy */
router.get("/automobile", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const automobile_arr = await automobileModel.find({}).sort({"updated_at": -1})
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('automobile', { title: 'All automobile', menuId: 'automobile', msg: notification_arr, adminname: admin_name, automobile_arr: automobile_arr, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});


/* past post_automobile function */
router.get('/post_automobile', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('post_automobile', { title: 'Post Automobile', menuId: 'automobile', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});

/* post automobile functin */
router.post("/post_automobile", upload.single('video'),async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	const videos = req.file;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				if(videos != '')
				{
					var name = req.body.name;
					var email = req.body.email;
					var mobile = req.body.mobile;
					
					if(name != '' && mobile != '' && email != '')
					{
						const post = new automobileModel();
						post.category = req.body.category;
						post.name = name;
						post.email = email;
						post.mobile = mobile;
						post.fuel = req.body.fuel;
						post.keywords = req.body.keywords;
						post.description = req.body.description;
						post.address = req.body.address;
						post.make = req.body.make;
						post.model = req.body.model;
						post.engine = req.body.engine;
						post.variant = req.body.variant;
						post.mileage = req.body.mileage;
						post.horse_power = req.body.horse_power;
						post.emission_class = req.body.emission_class;
						post.registration_year = req.body.registration_year;
						post.currency = req.body.currency;
						post.price = req.body.price;
						post.location = req.body.location;
						post.color = req.body.color;
						post.doors = req.body.doors;
						post.seats = req.body.seats;
						post.accessories = req.body.accessories;
						post.interior_seats = req.body.interior_seats;
						post.equipment_description = req.body.equipment_description;
						post.seller = req.body.seller;
						post.warranty = req.body.warranty;
						post.display_contact = req.body.display;
						post.condition = req.body.condition;
						post.gear_type = req.body.gear_type;
						post.base64_video = videos.filename;
						post.status = false;
						post.payment_status = false;
						post.created_at = moment().format("ll"); 
						post.updated_at = moment().format("ll"); 

						await post.save();
						
						req.flash('type', 'Success');
						req.flash('text_msg', 'Details are stored successful');
						res.redirect('/automobile');
					}
					else
					{
						var notification_arr = {
							'type': 'Error',
							'text_msg': 'all fields are required'
						}
						res.render('post_automobile', { title: 'Post Automobile', menuId: 'automobile', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition});
					}
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'please select the video'
					}
					res.render('post_automobile', { title: 'Post Automobile', menuId: 'automobile', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition});
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('post_automobile', { title: 'Post Automobile', menuId: 'automobile', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});

/* Automobile Details functionaliy */
router.get("/automobileDetails/:postId", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const automobileDetails = await automobileModel.findOne({_id: req.params.postId});
				// console.log('-> Data :', automobileDetails);
				if(automobileDetails != '')
				{
					var notification_arr = {
						'type': req.flash('type'),
						'text_msg': req.flash('text_msg')
					}
					res.render('automobileDetail', { title: 'Automobile Details', menuId: 'automobile', msg: notification_arr, adminname: admin_name, automobileDetails: automobileDetails, adminpermition: adminpermition});
				}
				else
				{
					const automobile_arr = await automobileModel.find({}).sort({"updated_at": -1})
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'User details not found'
					}
					res.render('automobile', { title: 'All automobile', menuId: 'automobile', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition, automobile_arr: automobile_arr });
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});

/* Get Edit automobile functionaliy */
router.get("/editAutomobile/:postID", async (req, res) => {
    var admin_name = req.session.admin_name;
    var emailId = req.session.emailId;
    if(emailId)
    {
        const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
            const editautomobile = await automobileModel.findOne({_id: req.params.postID});
            try
            {
                var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
                }
                res.render('edit_automobile', { title: 'Edit Automobile', menuId: 'automobile', msg: notification_arr, adminname:admin_name, editautomobile: editautomobile, adminpermition: adminpermition });
            }
            catch(error)
			{
                var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
                res.render('edit_automobile', { title: 'Edit Automobile', menuId: 'automobile', msg: notification_arr, adminname:admin_name, editautomobile: editautomobile, adminpermition: adminpermition });
            }
        }
        else
        {
            req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
        }
    }
    else
    {
        var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
        }
        res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
    }
});

router.post("/editAutomobile/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const editautomobile = await automobileModel.findOne({_id: req.params.postID});
			try
			{
				const post = await automobileModel.update({_id : req.params.postID},
					{$set : {
						keywords: req.body.keywords,
						description : req.body.description,
						address: req.body.address,
						make: req.body.make,
						model : req.body.model,
						variant : req.body.variant,
						engine : req.body.engine,
						horse_power : req.body.horse_power,
						mileage : req.body.mileage,
						fuel : req.body.fuel,
						emission_class : req.body.emission_class,
						seller : req.body.seller,
						condition : req.body.condition,
						gear_type : req.body.gear_type,
						registration_year : req.body.registration_year,
						currency : req.body.currency,
						price : req.body.price,
						warranty : req.body.warranty,
						location : req.body.location,
						color : req.body.color,
						interior_seats : req.body.interior_seats,
						doors : req.body.doors,
						seats : req.body.seats,
						equipment_description : req.body.equipment_description,
						accessories : req.body.accessories,
						status : req.body.status,
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/automobile");

			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('edit_automobile', { title: 'Edit Automobile', menuId: 'automobile', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});

/* Delete Schema for Automobile responce */
router.delete('/remove_automobile/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try
		{
			const post = await automobileModel.findByIdAndRemove({_id: req.params.postId}, function(err){
				if(err)
				{
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});

/* user Block Unblock Automobile functionaliy */
router.post('/userBlockUnblockAutomobile', async (req, res) => {
	console.log('-> inside function');
	var type = req.body.type;
	var data = req.body.uId;
	
	var id_array = data.split(",");
	var status = '';
	if(type == 'block')
	{
		status = true;
	}
	else
	{
		status = false;
	}
	const blockUnblock = await automobileModel.updateMany({_id : id_array},
		{$set : {status : status}
	});
	res.redirect('/globtech');
	return;
});

/* -------------------------  Boats Functinaliy Start -------------------------------------- */

/* Get boats functionaliy */
router.get("/boats", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const boats_arr = await boatsModel.find({}).sort({"updated_at": -1})
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('boats', { title: 'All Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition, boats_arr: boats_arr  });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'boats'});
	}
});

/* Add Boats functionaliy */
router.get('/post_boats', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('post_boats', { title: 'Post Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'boats'});
	}
});


/* post boats functin */
router.post("/post_boats", upload.single('video'),async (req, res, next) => {
	console.log(' call post_boats');
	var display = req.body.display;
	console.log('-> display :', display)
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	const videos = req.file;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				if(videos != '')
				{
					var name = req.body.name;
					var email = req.body.email;
					var mobile = req.body.mobile;
					if(name != '' && mobile != '' && email != '')
					{
						const post = new boatsModel();
						post.category = req.body.category;
						post.name = name;
						post.email = email;
						post.mobile = mobile;
						post.fuel = req.body.fuel;
						post.keywords = req.body.keywords;
						post.description = req.body.description;
						post.address = req.body.address;
						post.make = req.body.make;
						post.price = req.body.price;
						post.currency = req.body.currency;
						post.model = req.body.model;
						post.base64_video = videos.filename;
						post.year = req.body.year;
						post.length = req.body.length;
						post.width = req.body.width;
						post.depth = req.body.depth;
						post.boat_type = req.body.boat_type;
						post.power = req.body.power;
						post.fuel = req.body.fuel;
						post.water_capacity = req.body.water_capacity;
						post.no_of_bedrooms = req.body.no_of_bedrooms;
						post.no_of_bathrooms = req.body.no_of_bathrooms;
						post.engine_hours = req.body.engine_hours;
						post.engine_type = req.body.engine_type;
						post.no_of_engines = req.body.no_of_engines;
						post.hull_material = req.body.hull_material;
						post.color_hull = req.body.color_hull;
						post.location = req.body.location;
						post.display_contact = req.body.display;
						post.vat_payed = req.body.vat_payed;
						post.for = req.body.for;
						post.status = true;
						post.payment_status = false;
						post.created_at = moment().format("ll"); 
					
						await post.save();
						
						req.flash('type', 'Success');
						req.flash('text_msg', 'Details are stored successful');
						res.redirect('/boats');
					}
					else
					{
						var notification_arr = {
							'type': 'Error',
							'text_msg': 'all fields are required'
						}
						res.render('post_boats', { title: 'Post Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
					}
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'please select the video'
					}
					res.render('post_boats', { title: 'Post Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('post_boats', { title: 'Post Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'boats'});
	}
});

/* Boats Details functionaliy */
router.get("/boatsDetails/:postId", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const boatsDetails = await boatsModel.findOne({_id: req.params.postId});
				if(boatsDetails != '')
				{
					var notification_arr = {
						'type': req.flash('type'),
						'text_msg': req.flash('text_msg')
					}
					res.render('boatsDetail', { title: 'Boats Details', menuId: 'boats', msg: notification_arr, adminname: admin_name, boatsDetails: boatsDetails, adminpermition: adminpermition});
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'User details not found'
					}
					res.render('boatsDetail', { title: 'Boats Details', menuId: 'boats', msg: notification_arr, adminname: admin_name, boatsDetails: boatsDetails, adminpermition: adminpermition});
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'boats'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'boats'});
	}
});


/* Get Edit automobile functionaliy */
router.get("/editBoats/:postID", async (req, res) => {
    var admin_name = req.session.admin_name;
    var emailId = req.session.emailId;
    if(emailId)
    {
        const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
            const editboats = await boatsModel.findOne({_id: req.params.postID});
            try
            {
                var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
                }
                res.render('edit_boats', { title: 'Edit Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, editboats: editboats, adminpermition: adminpermition });
            }
            catch(error)
			{
                var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
                res.render('edit_boats', { title: 'Edit Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, editboats: editboats, adminpermition: adminpermition });
            }
        }
        else
        {
            req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
        }
    }
    else
    {
        var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
        }
        res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'boats'});
    }
});

router.post("/editBoats/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const editboats = await boatsModel.findOne({_id: req.params.postID});
			try
			{
				const post = await boatsModel.update({_id : req.params.postID},
					{ $set : {
						keywords: req.body.keywords,
						description : req.body.description,
						address: req.body.address,
						make: req.body.make,
						model : req.body.model,
						currency : req.body.currency,
						price : req.body.price,
						fuel : req.body.fuel,
						year : req.body.year,
						length : req.body.length,
						width : req.body.width,
						depth : req.body.depth,
						vat_payed : req.body.vat_payed,
						for : req.body.for,
						boat_type : req.body.boat_type,
						power : req.body.power,
						fule : req.body.fule,
						water_capacity : req.body.water_capacity,
						no_of_bedrooms : req.body.no_of_bedrooms,
						no_of_bathrooms : req.body.no_of_bathrooms,
						engine_hours : req.body.engine_hours,
						engine_type : req.body.engine_type,
						no_of_engines : req.body.no_of_engines,
						hull_material : req.body.hull_material,
						color_hull : req.body.color_hull,
						location : req.body.location,
						status: req.body.status,
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/boats");
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('edit_boats', { title: 'Edit Boats', menuId: 'boats', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'boats'});
	}
});

/* Delete Schema for Boats responce */
router.delete('/remove_boats/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try
		{
			const post = await boatsModel.findByIdAndRemove({_id: req.params.postId}, function(err){
				if(err)
				{
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'automobile'});
	}
});



/* user Block Unblock Automobile functionaliy */
router.post('/userBlockUnblockBoats', async (req, res) => {
	var type = req.body.type;
	var data = req.body.uId;
	
	var id_array = data.split(",");
	var status = '';
	if(type == 'block')
	{
		status = true;
	}
	else
	{
		status = false;
	}
	const blockUnblock = await boatsModel.updateMany({_id : id_array},
		{$set : {status : status}
	});
	res.redirect('/boats');
	return;
});


/*----------------------------- Start Globtech Functionaliy ------------------------------------------ */
router.get('/globtech', async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const globtech_arr = await globtechModel.find({}).sort({"updated_at": -1})
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('globtech', { title: 'Globtech', menuId: 'globtech', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition, globtech_arr: globtech_arr });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
	}
});

/* Post Globtech functionaliy */
router.get('/post_globtech', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('post_globtech', { title: 'Post Globtech', menuId: 'globtech', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
	}
});

router.post('/post_globtech', upload.single('video'),async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	const videos = req.file;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				if(videos != '')
				{
					var name = req.body.name;
					var email = req.body.email;
					var mobile = req.body.mobile;
					if(name != '' && mobile != '' && email != '')
					{
						const post = new globtechModel();
						post.category = req.body.category;
						post.name = name;
						post.email = email;
						post.mobile = mobile;
						post.keywords = req.body.keywords;
						post.description = req.body.description;
						post.address = req.body.address;
						post.make = req.body.make;
						post.price = req.body.price;
						post.location = req.body.location;
						post.base64_video = videos.filename;
						post.display_contact = req.body.display;
						post.status = true;
						post.payment_status = false;
						post.created_at = moment().format("ll"); 
					
						await post.save();
						
						req.flash('type', 'Success');
						req.flash('text_msg', 'Details are stored successful');
						res.redirect('/globtech');
					}
					else
					{
						var notification_arr = {
							'type': 'Error',
							'text_msg': 'all fields are required'
						}
						res.render('post_globtech', { title: 'Post Globtech', menuId: 'globtech', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
					}
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'please select the video'
					}
					res.render('post_globtech', { title: 'Post Globtech', menuId: 'globtech', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('post_globtech', { title: 'Post Globtech', menuId: 'globtech', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
	}
});


/* Boats Details functionaliy */
router.get("/globtechDetails/:postId", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const globtechDetails = await globtechModel.findOne({_id: req.params.postId});
				if(globtechDetails != '')
				{
					var notification_arr = {
						'type': req.flash('type'),
						'text_msg': req.flash('text_msg')
					}
					res.render('globtechDetail', { title: 'Globtech Details', menuId: 'globtech', msg: notification_arr, adminname: admin_name, globtechDetails: globtechDetails, adminpermition: adminpermition});
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'User details not found'
					}
					res.render('globtechDetail', { title: 'Globtech Details', menuId: 'globtech', msg: notification_arr, adminname: admin_name, globtechDetails: globtechDetails, adminpermition: adminpermition});
				}
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
	}
});


/* Get Edit automobile functionaliy */
router.get('/editGlobtech/:postID', async (req, res) => {
    var admin_name = req.session.admin_name;
    var emailId = req.session.emailId;
    if(emailId)
    {
        const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
            const editglobtech = await globtechModel.findOne({_id: req.params.postID});
            try
            {
                var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
                }
                res.render('edit_globtech', { title: 'Edit Globtech', menuId: 'globtech', msg: notification_arr, adminname: admin_name, editglobtech: editglobtech, adminpermition: adminpermition });
            }
            catch(error)
			{
                var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
                res.render('edit_globtech', { title: 'Edit Globtech', menuId: 'globtech', msg: notification_arr, adminname: admin_name, editglobtech: editglobtech, adminpermition: adminpermition });
            }
        }
        else
        {
            req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
        }
    }
    else
    {
        var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
        }
        res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
    }
});

/* Post Edit Globtech functionaliy */
router.post("/editGlobtech/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const editboats = await globtechModel.findOne({_id: req.params.postID});
			try
			{
				const post = await globtechModel.update({_id : req.params.postID},
					{ $set : {
						make: req.body.make,
						price: req.body.price,
						address: req.body.address,
						location: req.body.location,
						currency: req.body.currency,
						keywords: req.body.keywords,
						description : req.body.description,
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/globtech");
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('edit_globtech', { title: 'Edit Globtech', menuId: 'globtech', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
	}
});


/* Delete Schema for Boats responce */
router.delete('/remove_globtech/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try
		{
			const post = await globtechModel.findByIdAndRemove({_id: req.params.postId}, function(err){
				if(err)
				{
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globtech'});
	}
});

/* user Block Unblock Globtech functionaliy */
router.post('/userBlockUnblockGlobtech', async (req, res) => {
	console.log('-> inside function');
	var type = req.body.type;
	var data = req.body.uId;
	
	var id_array = data.split(",");
	var status = '';
	if(type == 'block')
	{
		status = true;
	}
	else
	{
		status = false;
	}
	const blockUnblock = await globtechModel.updateMany({_id : id_array},
		{$set : {status : status}
	});
	res.redirect('/globtech');
	return;
});

/*-----------------------------  End Globtech Functionaliy -------------------------------------------- */

router.get("/globpage", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(emailId)
	{
		var notification_arr = {
			'type': req.flash('type'),
			'text_msg': req.flash('text_msg')
		}
		res.render('globpage', { title: 'Advertiser', menuId: 'advertiser', msg: notification_arr, adminname:admin_name});
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'globpage'});
	}
});



/********************************** subscription ****************************************************/
/* get add user role */
router.get('/subscription', async (req, res) => {
	let emailId = req.session.emailId;
	let admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			// const plan_list = await PlanModel.find().sort({"updated_at": -1});
			const plan_list = await PlanModel.find();
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('subscription', {title: 'Subscription', menuId: 'subscription', msg: notification_arr, plan_list: plan_list, adminname: admin_name, adminpermition:adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'subscription'});
	}
});

/* Export to csv */
router.get('/export_to_plan', function(req, res, next) {
	var filename   = "plan.csv";
    var dataArray;
    PlanModel.find().lean().exec({}, function(err, plan) {
		if (err) res.send(err);
		console.log('-> PLAN:', plan);
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader("Content-Disposition", 'attachment; filename='+filename);
        res.csv(plan, true);
    });
});

/* addNewPlan */
router.get('/add_new_plan', async (req, res) => {
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('add_new_plan', {title: 'Subscription', menuId: 'subscription', msg: notification_arr, adminname: admin_name, adminpermition:adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'subscription'});
	}
});

router.post('/add_new_plan', async (req, res) => {
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var planPrice = req.body.price 
			var planName = req.body.plan_name;
			var planValidity = req.body.validity;
			var post_validity = req.body.post_validity;

			if(planPrice != '' && planName != '' && planValidity != '')
			{
				try
				{
					const PlanData = new PlanModel();
					PlanData.plan_name = planName;
					PlanData.plan_price = planPrice;
					PlanData.plan_Validity = planValidity;
					PlanData.post_validity = post_validity;
					PlanData.status = true;
					PlanData.created_at = moment().format("ll"); 
					PlanData.updated_at = moment().format("ll");

					await PlanData.save();
					
					req.flash('type', 'Success');
					req.flash('text_msg', 'Plan created successful');
					res.redirect('/subscription');
				}
				catch(error)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': error
					}
					res.render('add_new_plan', { title: 'Subscription', menuId: 'subscription', msg: notification_arr, adminname:admin_name, adminpermition:adminpermition});
				}
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Fill are all required field*'
				}
				res.render('add_new_plan', {title: 'Subscription', menuId: 'subscription', msg: notification_arr, adminname: admin_name, adminpermition:adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'subscription'});
	}
});

/* update plane schema */
router.get("/editplan/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId) {
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const edit_plan = await PlanModel.findOne({_id: req.params.postID});
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('editplan', { title: 'Edit Plan', menuId: 'subscription', edit_plan: edit_plan, msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });					
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('editplan', { title: 'Edit Plan', menuId: 'subscription', edit_plan: edit_plan, msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else {
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'subscription'});
	}
});

router.post("/editplan/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{			
				await PlanModel.update({ _id : req.params.postID},{
					$set : {
						plan_name : req.body.plan_name, 
						plan_Validity : req.body.validity, 
						plan_price : req.body.price,
						status : req.body.status, 
					}
				});
	
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/subscription");
			}
			catch(error)
			{
				const edit_plan = await PlanModel.findOne({_id: req.params.postID});
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('editplan', { title: 'Edit Plan', menuId: 'subscription', edit_plan: edit_plan, msg: notification_arr, adminname: admin_name });					
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");

		}
	}
});

/* Delete Schema responce */
router.delete('/removeplan/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try{
			const post = await PlanModel.findByIdAndRemove({
				_id: req.params.postId
			},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'subscription'});
	}
});

/* ------------------------------Start of Users Module ------------------------- */

router.get("/userrole", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const role_list = await RoleModel.find();
			console.log('-. role_list : ', role_list);
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('usersrole', {title: 'User Role', menuId: 'usersrole', msg: notification_arr, adminname: admin_name, role_list: role_list, adminpermition: adminpermition,});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'userrole'});
	}
});

/* Get Add New Role */
router.get("/addnewrole", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('addnewrole', { title: 'Add New Role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });		
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'addnewrole'});
	}
});

/* Post Add New Role */
router.post('/addnewrole', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var roleName = req.body.rolename;
			if(roleName != '')
			{
				try
				{
					const post = new RoleModel();
					post.role_name = roleName;
					post.status = true;
					post.created_at = moment().format("ll"); 
					post.updated_at = moment().format("ll");
	
					await post.save();
	
					req.flash('type', 'Success');
					req.flash('text_msg', 'Role created successful');
					res.redirect('/userrole');
				}
				catch(error)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': error
					}
					res.render('addnewrole', { title: 'Add New Role', menuId: 'access_role', msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });		
				}
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Fill are all required field*'
				}
				res.render('addnewrole', { title: 'Add New Role', menuId: 'access_role', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'addnewrole'});
	}
});

/************************************ Start Web-Site-Pages Module **************************************************/
/* Get about As Functionaliy */

router.get("/about", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const aboutusDetails = await aboutModel.findOne();
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('aboutAs', {title: 'About As', menuId: 'webpage', msg: notification_arr, aboutusDetails: aboutusDetails, adminname: admin_name, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'about'});
	}
});

/* Post about As Functionaliy */
router.post("/post_aboutas", async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{	
				const data = await aboutModel.findOne();
				console.log('-> data: ', data._id);	
				await aboutModel.update({ _id : data._id},{
					$set : {
						title : req.body.title, 
						description : req.body.description, 
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/about");
			}
			catch(error)
			{
				const aboutusDetails = await aboutModel.findOne({_id: data._id});
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('aboutAs', {title: 'About As', menuId: 'webpage', msg: notification_arr, aboutusDetails: aboutusDetails, adminname: admin_name, adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'about'});
	}
});


/* Get privacyPolicy Functionaliy */
router.get('/privacyPolicy', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const privacypolicy = await PrivacyPolicyModel.findOne();
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('privacyPolicy', {title: 'privacy policy', menuId: 'webpage', msg: notification_arr, privacypolicy: privacypolicy, adminname: admin_name, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'privacyPolicy'});
	}
});

/* Post Privacy Policy Functionaliy */
router.post("/postPrivacyPolicy", async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{	
				const data = await PrivacyPolicyModel.findOne();
				console.log('-> data: ', data._id);	
				await PrivacyPolicyModel.update({ _id : data._id},{
					$set : {
						title : req.body.title, 
						description : req.body.description, 
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/privacyPolicy");
			}
			catch(error)
			{
				const PolicyDetails = await PrivacyPolicyModel.findOne({_id: data._id});
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('privacyPolicy', {title: 'privacy policy', menuId: 'webpage', msg: notification_arr, PolicyDetails: PolicyDetails, adminname: admin_name, adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'privacyPolicy'});
	}
});

/* Get Terms Of Service Functionaliy */
router.get('/termsOfService', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const termsAndService = await termsOfServiceModel.findOne();
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('termsOfService', {title: 'Terms Of Service', menuId: 'webpage', msg: notification_arr, adminname: admin_name, termsAndService: termsAndService, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'termsOfService'});
	}
});

/* Post Privacy Policy Functionaliy */
router.post("/TermsOfService", async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{	
				const data = await termsOfServiceModel.findOne();
				await termsOfServiceModel.update({ _id : data._id},{
					$set : {
						title : req.body.title, 
						description : req.body.description, 
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/termsOfService");
			}
			catch(error)
			{
				const ServiceDetails = await termsOfServiceModel.findOne({_id: data._id});
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('termsOfService', {title: 'Terms Of Service', menuId: 'webpage', msg: notification_arr, ServiceDetails: ServiceDetails, adminname: admin_name, adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'termsOfService'});
	}
});

/* Get contactus Functionaliy */
router.get('/contactus', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const contactusData = await contactusModel.findOne();
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('contactus', {title: 'contact us', menuId: 'webpage', msg: notification_arr, contactusData: contactusData, adminname: admin_name, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'contactus'});
	}
});

/* Post Contact us Functionaliy */
router.post("/contactus", async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{	
				const data = await contactusModel.findOne();
				await contactusModel.update({ _id : data._id},{
					$set : {
						title : req.body.title, 
						description : req.body.description, 
					}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/contactus");
			}
			catch(error)
			{
				const contactusDetails = await contactusModel.findOne({_id: data._id});
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('contactus', {title: 'contact us', menuId: 'webpage', msg: notification_arr, contactusDetails: contactusDetails, adminname: admin_name, adminpermition: adminpermition});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'contactus'});
	}
});

/* Get faq Functionaliy */
router.get('/FAQ', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const faq_list = await faqModel.find();
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('faq', {title: 'FAQ', menuId: 'webpage', msg: notification_arr, faq_list: faq_list, adminname: admin_name, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'FAQ'});
	}
});

/* Get add_new_faq functionaliy */
router.get('/add_new_faq', async (req, res) => {
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('add_new_faq', {title: 'Add FAQ', menuId: 'webpage', msg: notification_arr, adminname: admin_name, adminpermition:adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'FAQ'});
	}
});

/* Post add_new_faq Functionaliy */
router.post("/add_new_faq", async (req, res,) => {
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var question = req.body.question 
			var answer = req.body.answer;
			if(question != '' && answer != '')
			{
				try
				{
					const faqData = new faqModel();
					faqData.question = question;
					faqData.answer = answer;
					faqData.created_at = moment().format("ll");
					faqData.status = true;
					
					await faqData.save();
					console.log('-> save data:', faqData);

					req.flash('type', 'Success');
					req.flash('text_msg', 'FAQ created successful');
					res.redirect('/FAQ');
				}
				catch(error)
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': error
					}
					res.render('add_new_faq', {title: 'Add FAQ', menuId: 'webpage', msg: notification_arr, adminname: admin_name, adminpermition:adminpermition });
				}
			}
			else
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'Fill are all required field*'
				}
				res.render('add_new_faq', {title: 'Add FAQ', menuId: 'webpage', msg: notification_arr, adminname: admin_name, adminpermition:adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'FAQ'});
	}
});

/* Get update FAQ schema */
router.get("/edit_faq/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId) {
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const edit_faq = await faqModel.findOne({_id: req.params.postID});
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('editfaq', { title: 'Edit Faq', menuId: 'webpage', edit_faq: edit_faq, msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('editfaq', { title: 'Edit Faq', menuId: 'webpage', edit_faq: edit_faq, msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'FAQ'});
	}
});

/* POST update FAQ schema */
router.post("/edit_faq/:postID", async (req, res) => {
	console.log('call POST edit function');
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{			
				await faqModel.update({ _id : req.params.postID},{
					$set : {
						question : req.body.question, 
						answer : req.body.answer, 
					}
				});
	
				req.flash('type', 'Success');
				req.flash('text_msg', 'Update successful');
				res.redirect("/FAQ");
			}
			catch(error)
			{
				const edit_faq = await faqModel.findOne({_id: req.params.postID});
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('editfaq', { title: 'Edit Faq', menuId: 'webpage', edit_faq: edit_faq, msg: notification_arr, adminname:admin_name, adminpermition: adminpermition });
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'FAQ'});
	}
});


/* Delete Schema responce */
router.delete('/removefaq/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try{
			const post = await faqModel.findByIdAndRemove({_id: req.params.postId},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'FAQ'});
	}
});

/******************************** End Of Website-Pages Module ****************************************************/


/********************************** Review And Ratings Module *************************************************/
/* Get Review And Ratings Functionaliy */

router.get('/reviewandratings', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('ratings', {title: 'Review & Ratings', menuId: 'ratings', msg: notification_arr, adminname: admin_name, adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'reviewandratings'});
	}
});

/********************************** Start Help Module *********************************************************/
/* Get Help Functionaliy */
router.get('/help', async (req, res) => {
	let emailId = req.session.emailId;
	let admin_name = req.session.admin_name;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const query_list = await helpModel.find().sort({"created_at":1});

			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('help', {title: 'Help', menuId: 'help', msg: notification_arr, query_list: query_list, adminname: admin_name, adminpermition:adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'help'});
	}
});

/* Delete Help Schema responce */
router.delete('/removeHelp/:postId', async (req, res) => {
	console.log('call remove function');
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		try
		{
			const post = await helpModel.findByIdAndRemove({_id: req.params.postId},function(err){
				if(err)
				{
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'help'});
	}
});
/**********************************End Of Help Module *********************************************************/

/********************************** Location Module *********************************************************/
/* Get Location&country Functionaliy */
router.get('/country', async (req, res) => {
	console.log('-> get_addLocation: 1');
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const country_result = await countryModel.find({}).sort({"country": 1});
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('country', {title: 'Country', menuId: 'location', msg: notification_arr, adminname: admin_name,  adminpermition: adminpermition, country_result: country_result});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'country'});
	}
});

/* get add_location */
router.get('/addLocation', async (req, res) => {
	console.log('-> get_addLocation: 2');
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('country', {title: 'Country', menuId: 'location', msg: notification_arr, adminname: admin_name,  adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'country'});
	}
});

/* Post add_location  */
router.post('/addLocation', async (req, res) => {
	console.log('-> post_addLocation: 3');
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if (emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try {
				var country = req.body.country;
				if(country != '') {
					let countryDetails = new countryModel({
						country : req.body.country,
						created_at : moment().format("ll"),
						updated_at : new Date().getTime(),
						status : true
			  		});
					await countryDetails.save();

					req.flash('type', 'Success');
					req.flash('text_msg', 'Country Create Successful');
					res.redirect('/country');
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'Country field is required'
					}
					res.render('country', {title: 'Country', menuId: 'location', msg: notification_arr, adminname: admin_name,  adminpermition: adminpermition});
				}
			}
			catch(error) {
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'country already exists'
				}
				res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'country'});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'country'});
	}
});

/* edit_country */
router.get("/editCountry/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const edit_country = await countryModel.findOne({_id: req.params.postID});
			try {
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('editCountry', { title: 'Edit Country', menuId: 'location', msg: notification_arr, adminname: admin_name, edit_country: edit_country, adminpermition: adminpermition });
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('editCountry', { title: 'Edit Country', menuId: 'location', msg: notification_arr, adminname: admin_name, edit_country: edit_country, adminpermition: adminpermition });
			}
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'country'});
	}
});

/* post edit_country schema*/
router.post("/editCountry/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const edit_country = await countryModel.findOne({_id: req.params.postID});
			try {
				var countrys = req.body.country;
				const post = await countryModel.update({_id : req.params.postID},
					{$set : {country : countrys}
				});
				req.flash('type', 'Success');
				req.flash('text_msg', 'Country details update successful');
				res.redirect('/country');
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('editCountry',{
					title: 'Edit Country',
					menuId: 'location',
					msg: notification_arr,
					adminname: admin_name,
					edit_country: edit_country,
					adminpermition: adminpermition
				});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'country'});	
	}
});

/* Delete Schema responce */
router.delete('/removeCountry/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try {
				const post = await countryModel.findByIdAndRemove({_id: req.params.postId}, function(err) {
					if(err){
						console.log(err);
						res.status.json({ err: err });
					}
					res.json({ success: true });
				});
			}
			catch(e)
			{
				res.send(500)
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'country'});
	}
});

/* Get Location&city Functionaliy */
router.get('/city', async (req, res) => {
	console.log('-> get city: 1');
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const countrys = await countryModel.find();
			const city_result = await cityModel.find();
			
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('city', {title: 'City', menuId: 'location', msg: notification_arr, adminname: admin_name,  adminpermition: adminpermition, city_result: city_result, countrys: countrys});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'city'});
	}
});

/* Get add_new_city functionaliy */
router.get('/addCity', async (req, res) => {
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const countrys = await countryModel.find();
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('addCity', {
				title: 'Add City',
				menuId: 'location',
				msg: notification_arr,
				countrys: countrys,
				adminname: admin_name,
				adminpermition: adminpermition
			});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', {
			title: 'Login',
			menuId: 'Login',
			msg: notification_arr,
			redirecturl: 'city'
		});
	}
});

/* Post add_location&City  */
router.post("/addCity", async (req, res, next) => {
	let admin_name = req.session.admin_name;
	let emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				var country = req.body.country;
				var city = req.body.city;
				if(country != '', city != '') {
					let cityDetails = new cityModel({
						city : req.body.city,
						country : req.body.country,
						created_at : moment().format("ll"),
						updated_at : new Date().getTime(),
						status : true
			  		});
					await cityDetails.save();

					req.flash('type', 'Success');
					req.flash('text_msg', 'City Create Successful');
					res.redirect('/city');
				}
				else
				{
					var notification_arr = {
						'type': 'Error',
						'text_msg': 'Country field is required'
					}
					res.render('addCity', {
						title: 'Add City',
						menuId: 'location',
						msg: notification_arr,
						adminname: admin_name,
						adminpermition: adminpermition
					});
				}
			}
			catch(error) {
				var notification_arr = {
					'type': 'Error',
					'text_msg': 'city already exists'
				}
				res.render('login', {
					title: 'Login',
					menuId: 'Login',
					msg: notification_arr,
					redirecturl: 'city'
				});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', {
			title: 'Login',
			menuId: 'Login',
			msg: notification_arr,
			redirecturl: city
		});
	}
});

/* Get edit_city schema  */
router.get("/editCity/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				const edit_city = await cityModel.findOne({_id: req.params.postID});
				
				var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
				res.render('editCity', {
					title: 'Edit City',
					menuId: 'location',
					msg: notification_arr,
					adminname: admin_name,
					edit_city: edit_city,
					adminpermition: adminpermition
				});
			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Warning',
					'text_msg': error
				}
				res.render('editCity', {
					title: 'Edit City',
					menuId: 'location',
					msg: notification_arr,
					adminname: admin_name,
					edit_city: edit_city,
					adminpermition: adminpermition
				});
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', {
			title: 'Login',
			menuId: 'Login',
			msg: notification_arr,
			redirecturl: city
		});
	}
});

/* post edit_country schema*/
router.post("/editCity/:postID", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);

		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try
			{
				var countrys = req.body.country;
				var city = req.body.city;
				const post = await cityModel.update({_id : req.params.postID},
					{$set : { country: countrys, city: city }
				});

				req.flash('type', 'Success');
				req.flash('text_msg', 'details update successful');
				res.redirect('/city');

			}
			catch(error)
			{
				var notification_arr = {
					'type': 'Error',
					'text_msg': error
				}
				res.render('editCity', {
					title: 'Edit City',
					menuId: 'location',
					msg: notification_arr,
					adminname: admin_name,
					edit_city: edit_city,
					adminpermition: adminpermition
				});
			}

		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', {
			title: 'Login',
			menuId: 'Login',
			msg: notification_arr,
			redirecturl: city
		});
	}
});

/* Delete Schema responce */
router.delete('/removeCity/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);

		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try {
				const post = await cityModel.findByIdAndRemove({_id: req.params.postId}, function(err) {
					if(err){
						console.log(err);
						res.status.json({ err: err });
					}
					res.json({ success: true });
				});
			}
			catch(e)
			{
				res.send(500)
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'city'});
	}
});
/****************************** End Of Location Module **********************************************/


/********************************** Start Abuse Module **************************************************/
/* Get Abuse Management Functionaliy */
router.get('/abuse', async (req, res, next) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);
		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			const abuse_result = await abuseModel.find().sort({"created_at":1});
			
			var notification_arr = {
				'type' : req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('abuse', {title: 'Abuse Management', menuId: 'abuse', msg: notification_arr, abuse_result: abuse_result, adminname: admin_name,  adminpermition: adminpermition});
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'abuse'});
	}
});


/* Delete Schema responce */
router.delete('/removeAbuse/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);

		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			try {
				const post = await abuseModel.findByIdAndRemove({_id: req.params.postId}, function(err) {
					if(err){
						console.log(err);
						res.status.json({ err: err });
					}
					res.json({ success: true });
				});
			}
			catch(e)
			{
				res.send(500)
			}
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'abuse'});
	}
});

/****************************** End Of Abuse Module ****************************************************/


/********************************** Start notification Module **************************************************/
/* recip_notification lists */
router.get("/recipnotification", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);

		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{			
			const recipient_lists = await Sendemail_list.find({});

			var notification_arr = {
					'type': req.flash('type'),
					'text_msg': req.flash('text_msg')
				}
			res.render('recipnotification', { title: 'Recipient Lists', menuId: 'notification', msg: notification_arr, recipient_lists: recipient_lists, adminname: admin_name, adminpermition: adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'recipnotification'});
	}
})

/* Get Create email Notification */
router.get("/createemail", async (req, res) => {
	console.log('-> createemail');
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId)
	{
		const permission_result = await Admin.findOne({"email": emailId});
		const adminpermition    = JSON.stringify(permission_result.role);

		if(adminpermition.includes('Admin') || adminpermition.includes('Vendor'))
		{
			// const template_result = await Emailtemplate.find({});
			const useremail_arr = await Users.find({}).sort({"email" : 1});

			var notification_arr = {
				'type': req.flash('type'),
				'text_msg': req.flash('text_msg')
			}
			res.render('createemail', { title: 'Recipient Lists', menuId: 'notification', msg: notification_arr, useremail_arr: useremail_arr, adminname: admin_name, adminpermition: adminpermition });
		}
		else
		{
			req.flash('type', 'Warning');
			req.flash('text_msg', 'Permission denied');
			res.redirect("/dashboard");
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'recipnotification'});
	}
});

const nodemailer = require("nodemailer");
/* Post Create email Notification */
router.post("/createemail", async (req, res) => {
	console.log('-> call post send notification ');
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(emailId) {
		try
		{
			var emaillist = req.body.email;
			if(emaillist)
			{
				console.log('-> Inside if');
				const post = new Sendemail_list();
				post.user_id = emaillist;
				post.ip_address = ip.address();
				post.subject = req.body.subject;
				post.message = req.body.message;
				post.admin_id = req.session.admin_id;
				post.created_at = moment().format("ll"); 

				await post.save();

				let toEmail   = emaillist;
				let toSubject = req.body.subject;
				let textmsg   = req.body.message;

				// var smtpTransport = nodemailer.createTransport({
				// 	service: 'gmail',
				// 	port: 587,
				// 	host: "smtp.ethereal.email",
				// 	auth: {
				// 		user: 'shailendra.brinfotech@gmail.com',
				// 		pass: 'brinfotech'
				// 	}
				// });

				let testAccount = await nodemailer.createTestAccount();

				// create reusable transporter object using the default SMTP transport
				let smtpTransport = nodemailer.createTransport({
					host: "smtp.ethereal.email",
					port: 587,
					secure: false,
					auth: {
						user: 'laisha46@ethereal.email',
        				pass: 'RFUM82mdzS7MUn8JXy'
					},
				});
				var mailOptions = {
					from: "Globavenue Notification <info@brinfotech.net>",
					to: toEmail,
					subject: toSubject,
					html:textmsg
				}
				smtpTransport.sendMail(mailOptions, (error, info) => {
					if (error) {
						console.log('error', error);
						req.flash('type', 'Warning');
						req.flash('text_msg', ' Username and Password not accepted');
						res.redirect('/recipnotification');
					}
					else
					{
						console.log('Message sent: %s', info.messageId);
						req.flash('type', 'Success');
						req.flash('text_msg', 'Notification send successful');
						res.redirect('/recipnotification');
					}
				});
				
				// var mailOptions = {
				// 	from: webEmail,
				// 	to: toEmail,
				// 	subject: toSubject,
				// 	html: textmsg
				// };
				// sgMail.sendMultiple(mailOptions);


				// ejs.renderFile(process.cwd() + "/views/evoaitemp.ejs", { message: textmsg, temp_image: temp_image }, function (err, data) {
				// 	if (err) {
				// 		console.log(err);
				// 	} else {
						
				// 		var mailOptions = {
				// 			from: webEmail,
				// 			to: toEmail,
				// 			subject: toSubject,
				// 			html: data
				// 		};
				// 		sgMail.sendMultiple(mailOptions);
				// 	}
				// });
			}
			else
			{
				req.flash('type', 'Warning');
				req.flash('text_msg', ' Username and Password not accepted');
				res.redirect('/recipnotification');
				
			}
		}
		catch(error)
		{
			var notification_arr = {
				'type': 'Error',
				'text_msg': error
			}
			res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'recipnotification'});
		}	
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'recipnotification'});
	}
});


router.delete('/removenotification/:postId', async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;	
	if(emailId)
	{
		try{
			const post = await Sendemail_list.findByIdAndRemove({
				_id: req.params.postId
			},function(err){
				if(err){
					console.log(err);
					res.status.json({ err: err });
				}
				res.json({ success: true });
			});
		}
		catch(e)
		{
			res.send(500)
		}
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'recipnotification'});
	}
})

/* Search email */	
router.post("/searchemail/:id", async (req, res) => {
	var admin_name = req.session.admin_name;
	var emailId = req.session.emailId;
	if(admin_name)
	{
		var findemail = req.params.id;
		var resp = '';
		if(findemail == '')
		{
			const useremail_arr = await Users.find({}).sort({"email" : 1});
			if(result_arr.length > 0)
			{
				resp +='<option value="">--- Select email ---</option>';
				for(var i=0; i < result_arr.length; i++)
				{
					resp += '<option value="'+result_arr[i].email+'">'+result_arr[i].email+'</option>';
				}
			}
		}
		else
		{
			var result_arr = await Users.find({ 'email': new RegExp(findemail, 'i') }).sort({"email" : 1});
			if(result_arr.length > 0)
			{
				resp +='<option value="">--- Select email ---</option>';
				for(var i=0; i < result_arr.length; i++)
				{
					resp += '<option value="'+result_arr[i].email+'">'+result_arr[i].email+'</option>';
				}
			}			
		}
		res.json(resp);		
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'createemail'});
	}
})

/* Search email */	
router.post("/searchstring/:id", async (req, res) => {
	var emailId = req.session.emailId;
	var admin_name = req.session.admin_name;
	if(admin_name)
	{
		var findemail = req.params.id;
		var resp = '';
		if(findemail == '')
		{
			const useremail_arr = await Users.find({}).sort({"email" : 1});
			if(result_arr.length > 0)
			{
				resp +='<option value="">--- Select email ---</option>';
				for(var i=0; i < result_arr.length; i++)
				{
					resp += '<option value="'+result_arr[i].email+'">'+result_arr[i].email+'</option>';
				}
			}
		}
		else
		{
			var result_arr = await Users.find({'email': { '$regex': '(\s+'+findemail+'|^'+findemail+')', '$options': 'i' }}, {}).sort({"email" : 1});
			if(result_arr.length > 0)
			{
				resp +='<option value="">--- Select email ---</option>';
				for(var i=0; i < result_arr.length; i++)
				{
					resp += '<option value="'+result_arr[i].email+'">'+result_arr[i].email+'</option>';
				}
			}			
		}
		res.json(resp);		
	}
	else
	{
		var notification_arr = {
			'type': 'Warning',
			'text_msg': 'Your are not logged In!'
		}
		res.render('login', { title: 'Login', menuId: 'Login', msg: notification_arr, redirecturl: 'recipientlists'});
	}
})

/****************************** End Of Setting Module ****************************************************/



/* Logout */
router.get("/logout", async (req,res) => {
	req.session.destroy()
	req.flash('type', 'Success');
	req.flash('text_msg', 'Logged out!');
	res.redirect('/');

});

/* ------------------------------End of Developement ------------------------- */

module.exports = router;