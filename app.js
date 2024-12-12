const CLIENT_ID = '3315620a5af04acc8f6e37443af97180';  // Remplace par ton client_id
const CLIENT_SECRET = 'cd4e8e7f43844ec6896fef6ef557a572';  // Remplace par ton client_secret
const REDIRECT_URI = 'https://avivacuisinescagnes.github.io/musical/callback';  // URI de redirection pour les tests locaux

let accessToken = '';

// Fonction pour obtenir un token d'accès de Spotify via OAuth
function getAccessToken() {
    if (!accessToken) {
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-private user-read-email`;
        window.location.href = authUrl;
    }
}

// Mapping des mots-clés principaux à des images
const genreImages = {
    pop: "images/pop.jpg",
    rock: "images/rock.jpg",
    hiphop: "images/hiphop.jpg",
    classical: "images/classical.jpg",
    electronic: "images/electronic.jpg",
    jazz: "images/jazz.jpg",
    metal: "images/metal.jpg",
    soul: "images/soul.jpg",  // Ajouté pour le genre "soul"
    default: "images/default.jpg" // Image par défaut pour les genres inconnus
};

// Fonction pour récupérer l'image associée au genre principal
function getImageForGenre(genres) {
    const simplifiedGenre = simplifyGenre(genres[0].toLowerCase());  // Prendre le premier genre et simplifier
    return genreImages[simplifiedGenre] || genreImages.default; // Retourner l'image correspondante au genre principal ou l'image par défaut
}

// Fonction pour simplifier un genre (enlever les variantes comme "british soul", "pop soul", etc.)
function simplifyGenre(genre) {
    const keywords = ["pop", "rock", "hiphop", "classical", "electronic", "jazz", "metal", "soul"];
    for (const keyword of keywords) {
        if (genre.includes(keyword)) {
            return keyword; // Retourne le mot-clé principal
        }
    }
    return genre; // Retourne le genre original si rien n'est trouvé
}

// Fonction pour détecter le genre principal (premier mot-clé dominant)
function detectMainGenre(genres) {
    return genres.length > 0 ? genres[0] : 'Genre inconnu'; // Retourner le premier genre ou un texte par défaut
}

// Fonction pour rechercher et afficher les données de la chanson
async function searchTrack() {
    const query = document.getElementById('track-search').value;
    if (!query) return;

    if (!accessToken) {
        alert('Veuillez vous connecter avec Spotify pour accéder aux données.');
        getAccessToken();
        return;
    }

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        const track = data.tracks.items[0];

        if (!track) {
            alert('Aucune chanson trouvée.');
            return;
        }

        // Récupérer les audio features
        const features = await getAudioFeatures(track.id);

        // Récupérer l'image pour les genres de l'artiste
        const artistId = track.artists[0].id;
        const genres = await getArtistGenres(artistId);
        const mainGenre = detectMainGenre(genres);
        const genreImage = getImageForGenre(genres);

        // Affichage pour le débogage
        console.log("Genres récupérés de l'artiste :", genres);
        console.log("Genre principal simplifié :", mainGenre);
        console.log("Image du genre :", genreImage);

        // Afficher les données et l'image du genre principal
        displayTrackInfo(track, features, genreImage, mainGenre);
    } catch (error) {
        console.error('Erreur lors de la recherche ou de la récupération des données : ', error);
        alert('Une erreur est survenue. Vérifiez la console pour plus de détails.');
    }
}

// Fonction pour récupérer les genres de l'artiste
async function getArtistGenres(artistId) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const artistData = await response.json();
        return artistData.genres || [];
    } catch (error) {
        console.error('Erreur lors de la récupération des genres de l\'artiste : ', error);
        return [];
    }
}

// Fonction pour récupérer les audio features
async function getAudioFeatures(trackId) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des audio features');
        }

        const features = await response.json();
        return features;
    } catch (error) {
        console.error('Erreur audio features : ', error);
        return {};
    }
}

// Affichage des informations sur la chanson
function displayTrackInfo(track, features, genreImage, mainGenre) {
    const trackInfoElement = document.getElementById('track-info');

    if (!trackInfoElement) {
        console.error('L\'élément d\'information sur la chanson n\'a pas été trouvé');
        return;
    }

    document.getElementById('track-name').textContent = track.name;
    document.getElementById('release-date').textContent = track.album && track.album.release_date ? track.album.release_date : 'Non disponible';
    document.getElementById('artist-name').textContent = track.artists[0].name;
    document.getElementById('artist-genres').textContent = mainGenre;

    // Ajouter l'image du genre principal
    const genreImageElement = document.getElementById('genre-image');
    if (genreImageElement) {
        genreImageElement.src = genreImage;
    }

    trackInfoElement.style.display = 'block';
}

// Récupérer le token d'accès Spotify à partir du hash URL après redirection
window.onload = function() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const params = new URLSearchParams(hash);
        accessToken = params.get('access_token');
        if (accessToken) {
            alert('Connecté à Spotify');
            window.location.hash = '';
        }
    }
};
