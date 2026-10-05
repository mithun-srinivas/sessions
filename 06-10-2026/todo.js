// The MODEL - what a todo looks like, and how we talk to the database.

const mongoose = require('mongoose');

// A SCHEMA describes the shape of one document: which fields it has,
// what type each one is, and what rules they follow.
const todoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true, // no title, no todo
      trim: true, // "  milk  " is saved as "milk"
    },
    done: {
      type: Boolean,
      default: false, // a new todo is never already done
    },
  },
  // adds createdAt and updatedAt, and keeps them up to date for us
  { timestamps: true }
);

// A MODEL is the schema turned into something you can call methods on:
// Todo.find(), Todo.create(), Todo.findById() and so on.
//
// The name 'Todo' decides the collection name: Mongoose lower-cases it
// and makes it plural, so our documents land in "todos".
module.exports = mongoose.model('Todo', todoSchema);
