const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported');
    throw new Error('WebGL not supported');
}

const vsSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec3 aColor;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying vec3 vColor;
    
    void main() {
        vColor = aColor;
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
`;

const fsSource = `
    precision mediump float;
    varying vec3 vColor;
    
    void main() {
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

function createCompleteCanData(bodyRadius, bodyHeight, segments) {
    const vertices = [];
    const normals = [];
    const colors = [];
    const indices = [];
    let currentIndex = 0;

    const bodyColor = [0.8, 0.1, 0.1];
    const topColor = [0.7, 0.7, 0.7];
    const bottomColor = [0.7, 0.7, 0.7];
    const rimColor = [0.85, 0.85, 0.85];

    const topNeckRadius = bodyRadius * 0.8;
    const topRadius = bodyRadius * 0.9;
    const bottomNeckRadius = bodyRadius * 0.8; 
    const bottomRadius = bodyRadius * 0.8;    
    const neckHeight = bodyHeight * 0.1;
    const rimHeight = bodyHeight * 0.05;
    const bottomIndent = bodyHeight * 0.05;

    function addVertex(x, y, z, nx, ny, nz, color) {
        vertices.push(x, y, z);
        normals.push(nx, ny, nz);
        colors.push(...color);
        return currentIndex++;
    }

    for (let i = 0; i <= segments; i++) {
        const theta = (i * Math.PI * 2) / segments;
        const x = bodyRadius * Math.cos(theta);
        const z = bodyRadius * Math.sin(theta);
        const nx = Math.cos(theta);
        const nz = Math.sin(theta);

        addVertex(x, -bodyHeight/2 + neckHeight, z, nx, 0, nz, bodyColor);
        addVertex(x, bodyHeight/2 - neckHeight, z, nx, 0, nz, bodyColor);
    }

    for (let i = 0; i < segments; i++) {
        const i0 = i * 2;
        const i1 = i0 + 1;
        const i2 = (i0 + 2) % (segments * 2 + 2);
        const i3 = (i0 + 3) % (segments * 2 + 2);

        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
    }

    const topNeckStartIndex = currentIndex;
    for (let i = 0; i <= segments; i++) {
        const theta = (i * Math.PI * 2) / segments;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        const x1 = bodyRadius * cos;
        const z1 = bodyRadius * sin;
        const x2 = topNeckRadius * cos;
        const z2 = topNeckRadius * sin;

        addVertex(x1, bodyHeight/2 - neckHeight, z1, cos, 0.3, sin, rimColor);
        addVertex(x2, bodyHeight/2 - rimHeight, z2, cos, 0.3, sin, rimColor);
    }

    for (let i = 0; i < segments; i++) {
        const i0 = topNeckStartIndex + i * 2;
        const i1 = i0 + 1;
        const i2 = i0 + 2;
        const i3 = i0 + 3;

        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
    }

    const bottomNeckStartIndex = currentIndex;
    for (let i = 0; i <= segments; i++) {
        const theta = (i * Math.PI * 2) / segments;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        const x1 = bodyRadius * cos;
        const z1 = bodyRadius * sin;
        const x2 = bottomNeckRadius * cos;
        const z2 = bottomNeckRadius * sin;

        addVertex(x1, -bodyHeight/2 + neckHeight, z1, cos, -0.3, sin, rimColor);
        addVertex(x2, -bodyHeight/2 + rimHeight, z2, cos, -0.3, sin, rimColor);
    }

    for (let i = 0; i < segments; i++) {
        const i0 = bottomNeckStartIndex + i * 2;
        const i1 = i0 + 1;
        const i2 = i0 + 2;
        const i3 = i0 + 3;

        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
    }

    const rimStartIndex = currentIndex;
    for (let i = 0; i <= segments; i++) {
        const theta = (i * Math.PI * 2) / segments;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        
        const x = topRadius * cos;
        const z = topRadius * sin;

        addVertex(x, bodyHeight/2 - rimHeight, z, 0, 1, 0, rimColor);
        addVertex(x, bodyHeight/2, z, 0, 1, 0, rimColor);
    }

    for (let i = 0; i < segments; i++) {
        const i0 = rimStartIndex + i * 2;
        const i1 = i0 + 1;
        const i2 = i0 + 2;
        const i3 = i0 + 3;

        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
    }

    const bottomStartIndex = currentIndex;
    addVertex(0, -bodyHeight/2 + 0.08, 0, 0, -1, 0, bottomColor);
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i * Math.PI * 2) / segments;
        const x = bottomRadius * Math.cos(theta);
        const z = bottomRadius * Math.sin(theta);
        addVertex(x, -bodyHeight/2 + 0.08, z, 0, -1, 0, bottomColor);
    }

    for (let i = 0; i < segments; i++) {
        indices.push(
            bottomStartIndex,
            bottomStartIndex + 1 + i,
            bottomStartIndex + 1 + ((i + 1) % segments)
        );
    }

    const topStartIndex = currentIndex;
    addVertex(0, bodyHeight/2, 0, 0, 1, 0, topColor);
    
    for (let i = 0; i <= segments; i++) {
        const theta = (i * Math.PI * 2) / segments;
        const x = topRadius * Math.cos(theta);
        const z = topRadius * Math.sin(theta);
        addVertex(x, bodyHeight/2, z, 0, 1, 0, topColor);
    }

    for (let i = 0; i < segments; i++) {
        indices.push(
            topStartIndex,
            topStartIndex + 1 + i,
            topStartIndex + 1 + ((i + 1) % segments)
        );
    }

    return {
        vertices: new Float32Array(vertices),
        normals: new Float32Array(normals),
        colors: new Float32Array(colors),
        indices: new Uint16Array(indices)
    };
}

const canData = createCompleteCanData(0.5, 1.5, 32);


const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, canData.vertices, gl.STATIC_DRAW);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, canData.normals, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, canData.colors, gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, canData.indices, gl.STATIC_DRAW);


const programInfo = {
    attribLocations: {
        position: gl.getAttribLocation(program, 'aPosition'),
        normal: gl.getAttribLocation(program, 'aNormal'),
        color: gl.getAttribLocation(program, 'aColor'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
    },
};

const fieldOfView = 45 * Math.PI / 180;
const aspect = canvas.clientWidth / canvas.clientHeight;
const zNear = 0.1;
const zFar = 100.0;
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

const modelViewMatrix = mat4.create();
let rotation = [0, 0, 0];
let zoom = -5;

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMouseX;
    const deltaY = e.clientY - lastMouseY;
    
    rotation[1] += deltaX * 0.01;
    rotation[0] += deltaY * 0.01;
    
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    
    console.log("Rotation updated:", rotation);
});


canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom += e.deltaY * 0.01;
    zoom = Math.max(-10, Math.min(-2, zoom));
    console.log("Zoom updated:", zoom);
});

// Render function
function render() {
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.identity(modelViewMatrix);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, zoom]);

    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation[0], [1, 0, 0]); // X-axis rotation
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0, 1, 0]); // Y-axis rotation
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation[1], [0, 0, 1]); // Y-axis rotation

    gl.useProgram(program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);


    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.normal);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.color, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.color);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, canData.indices.length, gl.UNSIGNED_SHORT, 0);

 
    requestAnimationFrame(render);
}

render();