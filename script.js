console.log("Let's write JavaScript");

// -------------------- Global Variables --------------------
let songs = [];              // current playlist ke sare songs
let currentFolder = "";      // kaunse folder ke songs chal rahe hain
let currentSong = new Audio();

// Important DOM elements
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("previous");
const nextBtn = document.getElementById("next");

// -------------------- Helper: Time Format --------------------
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00";

    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const m = String(minutes).padStart(2, "0");
    const s = String(secs).padStart(2, "0");

    return `${m}:${s}`;
}

// -------------------- Songs Load Karna --------------------
async function getSongs(folder) {
    try {
        currentFolder = folder;

        // folder ka index.html / directory listing fetch kar rahe hain
        const res = await fetch(`/${folder}/`);
        const response = await res.text();

        const div = document.createElement("div");
        div.innerHTML = response;

        const anchors = div.getElementsByTagName("a");
        songs = [];

        // saare .mp3 files nikaalo
        for (let i = 0; i < anchors.length; i++) {
            const element = anchors[i];
            if (element.href.includes(".mp3")) {
                const cleanName = element.href
                    .split(`/${folder}/`)[1]
                    .replace(/^\/+/, "");
                songs.push(cleanName);
            }
        }

        // Left side wali list me songs dikhana
        const songUl = document
            .querySelector(".list-song")
            .getElementsByTagName("ul")[0];

        songUl.innerHTML = "";

        for (const song of songs) {
            const displayName = song
                .replace(/^\/+/, "")
                .replaceAll("%20", " ");

            songUl.innerHTML += `
                <li>
                    <img src="img/playyy.svg" width="30" alt="">
                    <div class="songInfo">
                        <div>${displayName}</div>
                        <div>Song Artist</div>
                    </div>
                    <div class="play">
                        <span>Play Now</span>
                        <img class="playsvg" width="20" src="img/play.svg" alt="">
                    </div>
                </li>`;
        }

        // Har song pe click event
        Array.from(
            document
                .querySelector(".list-song")
                .getElementsByTagName("li")
        ).forEach((li) => {
            li.addEventListener("click", () => {
                const trackName = li
                    .querySelector(".songInfo")
                    .firstElementChild.innerHTML
                    .trim();
                playMusic(trackName);
            });
        });

        return songs;
    } catch (err) {
        console.error("Error loading songs:", err);
        return [];
    }
}

// -------------------- Music Play / Pause --------------------
function playMusic(track, pause = false) {
    track = track.replace(/^\/+/, "");

    currentSong.src = `/${currentFolder}/` + track;

    if (!pause) {
        currentSong.play();
        playBtn.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
}

// -------------------- Albums (cards) load karna --------------------
async function displayAlbums() {
    try {
        const res = await fetch(`/songs/`);
        const response = await res.text();

        const div = document.createElement("div");
        div.innerHTML = response;

        const anchors = div.getElementsByTagName("a");
        const cardContainer = document.querySelector(".cardContainer");

        Array.from(anchors).forEach(async (a) => {
            if (a.href.includes("/songs")) {
                const url = new URL(a.href);
                const parts = url.pathname.split("/").filter(Boolean);
                // URL: /songs/ncs/
                // parts: ["songs", "ncs"]
                const folder = parts[1];

                if (!folder || folder === "songs") return;

                try {
                    const infoRes = await fetch(`/songs/${folder}/info.json`);
                    if (!infoRes.ok) {
                        console.error("info.json not found for:", folder);
                        return;
                    }

                    const info = await infoRes.json();
                    console.log("Album:", folder, info);

                    cardContainer.innerHTML += `
                        <div class="card" data-folder="${folder}">
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h4>${info.title}</h4>
                            <p>${info.descriptions}</p>
                            <img class="play-btn" src="img/play.svg" alt="">
                        </div>`;
                } catch (err) {
                    console.error("JSON parse error (album):", err);
                }
            }
        });
    } catch (err) {
        console.error("Error loading albums:", err);
    }
}

// -------------------- Player Controls (play, next, prev, seek) --------------------
function setupPlayerControls() {
    // Play / Pause button
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "img/pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "img/playbutton.svg";
        }
    });

    // Time update + progress bar
    currentSong.addEventListener("timeupdate", () => {
        const current = currentSong.currentTime;
        const total = currentSong.duration;

        document.querySelector(".songTime").innerHTML =
            `${formatTime(current)}/${formatTime(total)}`;

        if (!isNaN(total) && total > 0) {
            const percent = (current / total) * 100;
            document.querySelector(".circle").style.left = percent + "%";
        }
    });

    // Seek bar click
    const seekBar = document.querySelector(".seek-bar");
    seekBar.addEventListener("click", (e) => {
        const rect = seekBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = (clickX / rect.width) * 100;

        document.querySelector(".circle").style.left = percent + "%";

        if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
            currentSong.currentTime =
                (currentSong.duration * percent) / 100;
        }
    });

    // Previous button
    prevBtn.addEventListener("click", () => {
        const currentFile = currentSong.src.split("/").slice(-1)[0];
        const index = songs.indexOf(currentFile);

        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next button
    nextBtn.addEventListener("click", () => {
        const currentFile = currentSong.src.split("/").slice(-1)[0];
        const index = songs.indexOf(currentFile);

        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });
}

// -------------------- Side Menu (hamburger) --------------------
function setupSideMenu() {
    const hamburger = document.querySelector(".hamburger");
    const leftPanel = document.querySelector(".left");
    const cross = document.querySelector(".cross");

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            leftPanel.style.left = "0";
        });
    }

    if (cross) {
        cross.addEventListener("click", () => {
            leftPanel.style.left = "-100%";
        });
    }
}

// -------------------- Card click → Album load --------------------
function setupCardClickForAlbums() {
    const cardContainer = document.querySelector(".cardContainer");

    cardContainer.addEventListener("click", async (e) => {
        const card = e.target.closest(".card");
        if (!card) return;

        const folder = card.dataset.folder;
        if (!folder) return;

        songs = await getSongs(`songs/${folder}`);

        if (songs.length > 0) {
            playMusic(songs[0]); // pehla song play
        }
    });
}

// -------------------- Volume Controls (Mute + Slider) --------------------
function setupVolumeControls() {
    const volumeImg = document.querySelector(".range img");
    const volumeSlider = document.getElementById("volumeSlider");

    if (!volumeImg || !volumeSlider) {
        console.warn("Volume controls (.range img + #volumeSlider) nahi mile");
        return;
    }

    // 👇 Starting volume (thoda kam rakha hai)
    let lastVolume = 0.25; // 25% approx
    currentSong.volume = lastVolume;
    volumeSlider.value = 50; // slider middle pe

    // Helper: slider (0–100) ko human-friendly volume (0–1) banaye
    function sliderToVolume(sliderValue) {
        const x = sliderValue / 100;      // 0–1
        // quadratic / cubic curve: neeche ka part bohot soft, upar jaate jaate loud
        const v = Math.pow(x, 2.2);      // 2 rakho, zyada soft chahiye to 2.5 ya 3 kar dena
        // safety: max volume limit (80%)
        return Math.min(v, 0.8);
    }

    function updateIconForVolume(vol) {
        if (vol === 0) {
            if (!volumeImg.src.includes("mute.svg")) {
                volumeImg.src = volumeImg.src.replace("volume.svg", "mute.svg");
            }
        } else {
            if (!volumeImg.src.includes("volume.svg")) {
                volumeImg.src = volumeImg.src.replace("mute.svg", "volume.svg");
            }
        }
    }

    // 🔇 Mute / Unmute icon click
    volumeImg.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            // abhi sound hai → mute karo
            lastVolume = currentSong.volume || sliderToVolume(30); // yaad rakh lo
            currentSong.volume = 0;
            volumeSlider.value = 0;
            updateIconForVolume(0);
        } else {
            // abhi mute hai → last volume wapas lao
            currentSong.volume = lastVolume || sliderToVolume(30);
            // slider ko approx wapas laane ke liye:
            volumeSlider.value = Math.round(Math.pow(currentSong.volume / 0.8, 1 / 2.2) * 100);
            updateIconForVolume(currentSong.volume);
        }
    });

    // 🎚 Slider se volume change (real-time)
    volumeSlider.addEventListener("input", (e) => {
        const value = Number(e.target.value); // 0–100
        const vol = sliderToVolume(value);
        currentSong.volume = vol;

        updateIconForVolume(vol);

        if (vol > 0) {
            lastVolume = vol;
        }
    });
}


// -------------------- Main Function --------------------
async function main() {
    // Default folder ke songs load karo
    await getSongs("songs/ncs");

    if (songs.length > 0) {
        // pehle song ko load karo, lekin auto play mat karo
        playMusic(songs[0], true);
    }

    // Albums load karo
    await displayAlbums();

    // Controls setup
    setupPlayerControls();
    setupSideMenu();
    setupCardClickForAlbums();
    setupVolumeControls();
}

// Run main
main().catch((err) => {
    console.error("Error in main():", err);
});