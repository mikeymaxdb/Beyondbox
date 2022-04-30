if (window.innerWidth >= 16 * 50) {
    const canvas = document.getElementById('FlairCanvas')
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true })
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 1, 100)

    const geometry = new THREE.TorusGeometry(15, 5, 16, 100)
    const material = new THREE.PointsMaterial({ size: 0.1, color: 0xf8f8f2 })
    const mesh = new THREE.Points(geometry, material)

    renderer.setPixelRatio(window.devicePixelRatio)
    camera.position.z = 40
    scene.add(mesh)

    function tick() {
        renderer.render(scene, camera)

        mesh.rotation.x += 0.0025
        mesh.rotation.y += 0.0025

        window.requestAnimationFrame(tick)
    }

    tick()
}