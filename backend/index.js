const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock data for videos
const videos = [
    {
        id: 'c2f5d5f2-9a7b-4e2a-8f1d-9b6b7a5c1e3d',
        title: 'React Native Tutorial for Beginners - Build a React Native App [2024]',
        channel: 'Programming with Mosh',
        views: '1.2M',
        uploaded: '1 year ago',
        duration: '2:34:15',
        thumbnailUrl: 'https://i.ytimg.com/vi/0-S5a0eXPoc/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc'
    },
    {
        id: 'a1b3c4d5-e6f7-8g9h-0i1j-2k3l4m5n6o7p',
        title: 'Expo Router v3 - File-based Routing for Universal React Native',
        channel: 'Expo',
        views: '15k',
        uploaded: '3 weeks ago',
        duration: '15:23',
        thumbnailUrl: 'https://i.ytimg.com/vi/2C_jShtL7aU/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=2C_jShtL7aU'
    },
    {
        id: 'f9e8d7c6-b5a4-3c2b-1a98-7654321fedcb',
        title: 'The ultimate guide to animations in React Native',
        channel: 'notJust.dev',
        views: '137k',
        uploaded: '9 months ago',
        duration: '4:21:54',
        thumbnailUrl: 'https://i.ytimg.com/vi/R-K4sN_2V_I/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=R-K4sN_2V_I'
    },
    {
        id: 'd0e1f2a3-b4c5-d6e7-f8g9-h0i1j2k3l4m5',
        title: 'What\'s new in React Native 0.73',
        channel: 'React Native',
        views: '50k',
        uploaded: '2 months ago',
        duration: '10:05',
        thumbnailUrl: 'https://i.ytimg.com/vi/eJ3t8T-J-Fw/hqdefault.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=eJ3t8T-J-Fw'
    }
];

// Mock data for comments
const comments = {
    'c2f5d5f2-9a7b-4e2a-8f1d-9b6b7a5c1e3d': [
        { id: '1', user: 'User1', comment: 'Great tutorial!' },
        { id: '2', user: 'User2', comment: 'Very helpful, thanks!' }
    ],
    'a1b3c4d5-e6f7-8g9h-0i1j-2k3l4m5n6o7p': [
        { id: '3', user: 'User3', comment: 'Expo router is awesome!' }
    ]
};

app.get('/', (req, res) => {
  res.send('Hello from Express backend for YouTube Clone!');
});

// Get all videos
app.get('/api/videos', (req, res) => {
    res.json(videos);
});

// Get a single video by ID
app.get('/api/videos/:id', (req, res) => {
    const video = videos.find(v => v.id === req.params.id);
    if (video) {
        res.json(video);
    } else {
        res.status(404).send('Video not found');
    }
});

// Get comments for a video
app.get('/api/videos/:id/comments', (req, res) => {
    const videoComments = comments[req.params.id] || [];
    res.json(videoComments);
});

// Post a comment to a video
app.post('/api/videos/:id/comments', (req, res) => {
    const { user, comment } = req.body;
    if (!user || !comment) {
        return res.status(400).send('User and comment are required');
    }

    if (!comments[req.params.id]) {
        comments[req.params.id] = [];
    }

    const newComment = {
        id: (comments[req.params.id].length + 1).toString(),
        user,
        comment
    };
    comments[req.params.id].push(newComment);
    res.status(201).json(newComment);
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
