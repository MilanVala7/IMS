const libExpress = require('express');

const app = libExpress();

const port = 5000;

app.post('/users', (req, res) => {    
  console.log('User created successfully');
  res.status(201).send("User created successfully");
});

app.post('/teams', (req, res) => {
  console.log('Team created successfully');
  res.status(201).send("Team created successfully");
});

app.post('/players', (req, res) => {
    console.log('Player created successfully');
    res.status(201).send("Player created successfully");
});


app.listen(port, () => {
  console.log(`Server is running on ${port}`);
})
