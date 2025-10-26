class RenderingEngine {
    constructor(bounds) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000033);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 20);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        // Arena
        const gridHelper = new THREE.GridHelper(bounds * 2, bounds * 2);
        this.scene.add(gridHelper);
        const boxHelper = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(bounds * 2, 1, bounds * 2)));
        this.scene.add(boxHelper);

        // Player
        const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.scene.add(this.player);

        // AI
        const aiGeometry = new THREE.BoxGeometry(1, 1, 1);
        const aiMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.ai = new THREE.Mesh(aiGeometry, aiMaterial);
        this.scene.add(this.ai);

        this.playerTrail = [];
        this.aiTrail = [];
    }

    draw(gameState) {
        // Update 3D objects from game state
        this.player.position.x = gameState.player.x;
        this.player.position.z = gameState.player.z;

        this.ai.position.x = gameState.ai.x;
        this.ai.position.z = gameState.ai.z;

        // Create new trail segments
        if (this.playerTrail.length < gameState.playerTrail.length) {
            const lastSegment = gameState.playerTrail[gameState.playerTrail.length - 1];
            this.createTrailSegment(lastSegment, 0x00ff00, this.playerTrail);
        }

        if (this.aiTrail.length < gameState.aiTrail.length) {
            const lastSegment = gameState.aiTrail[gameState.aiTrail.length - 1];
            this.createTrailSegment(lastSegment, 0xff0000, this.aiTrail);
        }

        this.updateCamera(this.player.position);
        this.renderer.render(this.scene, this.camera);
    }

    createTrailSegment(position, color, trail) {
        const trailGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
        const trailMaterial = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
        const trailSegment = new THREE.Mesh(trailGeometry, trailMaterial);
        trailSegment.position.x = position.x;
        trailSegment.position.z = position.z;
        this.scene.add(trailSegment);
        trail.push(trailSegment);
    }

    updateCamera(playerPosition) {
        this.camera.position.x = playerPosition.x;
        this.camera.position.y = 20;
        this.camera.position.z = playerPosition.z + 15;
        this.camera.lookAt(playerPosition);
    }

    clearTrails() {
        for (const segment of this.playerTrail) {
            this.scene.remove(segment);
        }
        for (const segment of this.aiTrail) {
            this.scene.remove(segment);
        }
        this.playerTrail.length = 0;
        this.aiTrail.length = 0;
    }
}

module.exports = { RenderingEngine };
