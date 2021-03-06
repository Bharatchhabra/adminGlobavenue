const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const privacy_policySchema = new Schema({
    title: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    status: {
		type: Boolean,
		default: false
	},
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
})

module.exports = mongoose.model('Privacy_policy', privacy_policySchema);