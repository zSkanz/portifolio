const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const port = 3005;
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Métodos Privados
function abbreviateNumber(number, idp = 1) {

    if (number < 999) return number.toString();
    const NumberSuffixes = ["", "K", "M", "B", "T", "Q"]; // Adicione os sufixos conforme necessário
    const exp = Math.floor(Math.log10(Math.max(1, Math.abs(number))) / 3);
    const suffix = NumberSuffixes[exp] || 'e+' + exp;
    const norm = Math.floor(number * Math.pow(10, idp) / Math.pow(1000, exp)) / Math.pow(10, idp);

    return norm.toFixed(idp).replace(/\.?0+$/, '') + suffix;
}

const getRobloxGameImageUrl = async (robloxGameId) => {
    try {
        var response = await axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${robloxGameId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`)
        return response.data.data[0].imageUrl;
    } catch (error) {
        console.error(`Error fetching image for game ID ${robloxGameId}:`, error);
        return 'https://via.placeholder.com/150';
    }
};

const getRobloxgameVisits = async (robloxGameId) => {
    try {
        var response = await axios.get(`https://games.roblox.com/v1/games?universeIds=${robloxGameId}`);
        return response.data.data[0].visits;
    } catch (error) {
        //console.error(`Error fetching image for game ID ${robloxGameId}:`, error);
        return 'Failed to load!';
    }
}

const getUniverseId = async (robloxGameId) => {
    try {
        var response = await axios.get(`https://apis.roblox.com/universes/v1/places/${robloxGameId}/universe`);
        return response.data.universeId;
    } catch (error) {
        return 0;
    } 
}

app.get('/', async (req, res) => {
    const projectsFilePath = path.join(__dirname, 'json', 'roblox_games.json');
    const projects = JSON.parse(fs.readFileSync(projectsFilePath, 'utf-8'));
    
    var amountOfVisits = 0;

    for (let project of projects) {
        project.universeId = await getUniverseId(project.roblox_game_id);
        project.imageUrl = await getRobloxGameImageUrl(project.universeId);
        project.link = `https://www.roblox.com/games/${project.roblox_game_id}`;
        var currentAmount = await getRobloxgameVisits(project.universeId)
        amountOfVisits += currentAmount;
        project.visits = abbreviateNumber(currentAmount);
    }

    res.render('index', {projects, amountOfVisits: abbreviateNumber(amountOfVisits)});

})

app.listen(port, (error) => {
    console.log(error || "Server Started At Port: "+port);
})