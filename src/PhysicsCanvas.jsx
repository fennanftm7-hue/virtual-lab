// PhysicsCanvas.jsx

import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import Matter from 'matter-js';

// =========================
// SOCKET
// =========================



const PhysicsCanvas = ({ socket, roomID, username }) => {


  // =========================
  // REFS
  // =========================

  const sceneRef = useRef(null);

  const engineRef = useRef(null);

  const bodiesRef = useRef({});

  const prevErrorRef = useRef(0);

  const hoverTargetRef = useRef(null);

  const integralRef = useRef(0);

  const constraintsRef = useRef([]);

  const forceCacheRef = useRef({});

  const stressRef = useRef({});

  const brokenConstraintsRef =
  useRef(new Set());

  const windRef = useRef(0);

const pidRef = useRef({
  kp: 0.02,
  ki: 0.00001,
  kd: 0.01
});

const buildModeRef = useRef(null);
const selectedBodiesRef = useRef([]);

const motorsRef = useRef([]);

const showVelocityRef = useRef(true);
const showForceRef = useRef(true);
const showSpringRef = useRef(false);
const showPendulumRef = useRef(false);
const showBridgeRef = useRef(false);
const isHoveringRef = useRef(false);
const springRef = useRef(null);
const pendulumConstraintRef = useRef(null);
const bridgeBodiesRef = useRef([]);
const bridgeConstraintsSystemRef = useRef([]);

const isHostRef = useRef(false);

const hasAppliedSharedStateRef = useRef(false);

const pendulumLengthRef = useRef(220);
const [pendulumLength, setPendulumLength] = useState(220);


  // =========================
  // STATE
  // =========================

  const [physicsData, setPhysicsData] =
    useState([]);

  const [annotations, setAnnotations] =
    useState([]);

  const [cursors, setCursors] =
    useState({});

  const [history, setHistory] =
    useState([]);

  const [
  savedExperiments,
  setSavedExperiments
] = useState([]);

  const [gravity, setGravity] =
    useState(0.6);

  const [showVelocityVectors,
  setShowVelocityVectors] =
  useState(true);

const [showForceVectors,
  setShowForceVectors] =
  useState(true);

  const [isHovering, setIsHovering] =
  useState(false);

  const [wind, setWind] =
  useState(0);

const [kp, setKp] =
  useState(0.02);

const [ki, setKi] =
  useState(0.00001);

const [kd, setKd] =
  useState(0.01);

const [showSpring, setShowSpring] =
  useState(false);

const [showPendulum, setShowPendulum] =
  useState(false);

const [showBridge, setShowBridge] =
  useState(false);

const [buildMode, setBuildMode] =
  useState(null);

const [selectedBodies, setSelectedBodies] =
  useState([]);

const [selectedMaterial, setSelectedMaterial] =
  useState('wood');


const applyTemplate = (key) => {
  const template = LAB_TEMPLATES[key];
  if (!template) return;

  setGravity(template.gravity);
  windRef.current = template.wind;

  if (engineRef.current) {
    engineRef.current.world.gravity.y = template.gravity;
  }

  setWind(template.wind);

  socket.emit("env_change", {
    gravity: template.gravity,
    wind: template.wind
  });

  alert(`Loaded template: ${key}`);
};

const cancelTemplate = () => {
  const defaultGravity = 0.6;
  const defaultWind = 0;

  setGravity(defaultGravity);
  setWind(defaultWind);

  windRef.current = defaultWind;

  if (engineRef.current) {
    engineRef.current.world.gravity.y = defaultGravity;
  }

  socket.emit("env_change", {
    gravity: defaultGravity,
    wind: defaultWind
  });

  alert("Lab preset cancelled");
};

const rebuildBridge = () => {
  const world = engineRef.current.world;
  const bridgeBodies = bridgeBodiesRef.current;
  const bridgeConstraints = bridgeConstraintsSystemRef.current;

  // Remove existing bridge
  bridgeBodies.forEach(body => {
    Matter.Composite.remove(world, body);
  });
  bridgeConstraints.forEach(constraint => {
    Matter.Composite.remove(world, constraint);
  });

  // Reset damage on constraints
  bridgeConstraints.forEach(constraint => {
    constraint.damage = 0;
    constraint.LastHitTime = 0;
    constraint.render.strokeStyle = '#fbbf24';
    constraint.render.lineWidth = 2;
  });

  // Clear broken set
  brokenConstraintsRef.current.clear();

  // Re-add everything
  Matter.Composite.add(world, [
    ...bridgeBodies,
    ...bridgeConstraints
  ]);
};


const [participants, setParticipants] =
  useState([]);

const generateShareData = () => {
  return {
    roomID,
    gravity,
    wind,
    timestamp: Date.now()
  };
};
  

  const LAB_TEMPLATES = {
  gravity_lab: {
    gravity: 1.2,
    wind: 0,
    setup: "standard"
  },

  calm_lab: {
    gravity: 0.3,
    wind: 0,
    setup: "standard"
  },

  storm_lab: {
    gravity: 0.8,
    wind: 3,
    setup: "standard"
  },

  chaos_lab: {
    gravity: 1.5,
    wind: 5,
    setup: "standard"
  }
};


  // =========================
// MATERIAL PRESETS
// =========================

const MATERIALS = {

  wood: {
    density: 0.001,
    friction: 0.7,
    restitution: 0.2,
    color: '#8b5e3c',
    stressLimit: 8
  },

  steel: {
    density: 0.005,
    friction: 0.3,
    restitution: 0.05,
    color: '#9ca3af',
    stressLimit: 20
  },

  rubber: {
    density: 0.002,
    friction: 0.9,
    restitution: 0.9,
    color: '#111827',
    stressLimit: 12
  },

  ice: {
    density: 0.0015,
    friction: 0.01,
    restitution: 0.3,
    color: '#bfdbfe',
    stressLimit: 5
  }

};

//Apply Materials
const applyMaterialToBody = (
  body,
  materialName
) => {

  const material =
    MATERIALS[materialName];

  if (!material || !body) return;

  body.friction =
    material.friction;

  body.restitution =
    material.restitution;

  body.density =
    material.density;

  body.stressLimit =
    material.stressLimit;

  body.render.fillStyle =
    material.color;

  Matter.Body.setDensity(
    body,
    material.density
  );

};


  // =========================
  // EFFECT
  // =========================

  useEffect(() => {

    let isMounted = true;

    fetchExperiments();

    socket.emit('join_room', {
  roomID,
  username
});

const params = new URLSearchParams(window.location.search);
const state = params.get("state");

if (state && !hasAppliedSharedStateRef.current) {
  try {
    const decoded = JSON.parse(atob(state));

    if (decoded.gravity !== undefined) {
      setGravity(decoded.gravity);
      if (engineRef.current) {
        engineRef.current.world.gravity.y = decoded.gravity;
      }
    }

    if (decoded.wind !== undefined) {
      setWind(decoded.wind);
      windRef.current = decoded.wind;
    }

    hasAppliedSharedStateRef.current = true;

  } catch (e) {
    console.error("Invalid shared state", e);
  }
}

if (state) {
  try {
    const decoded = JSON.parse(atob(state));

    if (decoded.gravity !== undefined) {
      setGravity(decoded.gravity);

      if (engineRef.current) {
        engineRef.current.world.gravity.y = decoded.gravity;
      }
    }

    if (decoded.wind !== undefined) {
      setWind(decoded.wind);
      windRef.current = decoded.wind;
    }

  } catch (e) {
    console.error("Invalid shared state", e);
  }
}


    const WIDTH = 800;
    const HEIGHT = 600;

    // =========================
    // ENGINE
    // =========================

    const engine =
      Matter.Engine.create();

    engineRef.current = engine;

engine.positionIterations = 12;
engine.velocityIterations = 10;
engine.constraintIterations = 8;

    engine.world.gravity.y = 0.6;

    // =========================
    // RENDER
    // =========================

    const render =
      Matter.Render.create({
        element: sceneRef.current,
        engine,
        options: {
          width: WIDTH,
          height: HEIGHT,
          wireframes: false,
          background: '#0a192f'
        }
      });

      
    // =========================
    // WALLS
    // =========================

    const ground =
      Matter.Bodies.rectangle(
        400,
        590,
        900,
        100,
        {
          isStatic: true,
          render: {
            fillStyle: '#374151'
          }
        }
      );

    const leftWall =
      Matter.Bodies.rectangle(
        0,
        300,
        100,
        700,
        {
          isStatic: true,
          render: {
            fillStyle: '#374151'
          }
        }
      );

    const rightWall =
      Matter.Bodies.rectangle(
        800,
        300,
        100,
        700,
        {
          isStatic: true,
          render: {
            fillStyle: '#374151'
          }
        }
      );

    const ceiling =
      Matter.Bodies.rectangle(
        400,
        0,
        900,
        100,
        {
          isStatic: true,
          render: {
            fillStyle: '#374151'
          }
        }
      );

      const bridgeBodies = [];

bridgeBodiesRef.current = bridgeBodies;


const bridgeConstraints = [];

bridgeConstraintsSystemRef.current = bridgeConstraints;

    // =========================
    // OBJECTS
    // =========================

    const box =
      Matter.Bodies.rectangle(
        400,
        200,
        80,
        80,
        {
          label: 'box',
          restitution: 0.8,
          friction: 0.05,
          frictionAir: 0.03,
          render: {
            fillStyle: '#3b82f6',
            strokeStyle: '#000000',
lineWidth: 1
          }
        }
      );

    const ball =
      Matter.Bodies.circle(
        500,
        100,
        40,
        {
          label: 'ball',
          restitution: 0.9,
          friction: 0.05,
          frictionAir: 0.03,
          render: {
            fillStyle: '#ef4444',
            strokeStyle: '#000000',
lineWidth: 1
          }
        }
      );

    const triangle =
      Matter.Bodies.polygon(
        300,
        100,
        3,
        50,
        {
          label: 'triangle',
          restitution: 0.7,
          friction: 0.05,
          frictionAir: 0.03,
          render: {
            fillStyle: '#10b981',
            strokeStyle: '#000000',
lineWidth: 1
          }
        }
      );

      const pendulumBall =
  Matter.Bodies.circle(
    650,
    250,
    35,
    {
      label: 'pendulum',
      restitution: 0.9,
      frictionAir: 0.002,
      render: {
        fillStyle: '#a855f7'
      }
    }
  );


    // =========================
    // STORE BODIES
    // =========================

    bodiesRef.current = {
      box,
      ball,
      triangle,
      pendulum: pendulumBall
    };

    // =========================
// SPRING CONSTRAINT
// =========================

const spring =
  Matter.Constraint.create({

    bodyA: triangle,

    bodyB: ball,

    stiffness: 0.02,

    damping: 0.05,

    length: 150,

    render: {
      strokeStyle: '#facc15',
      lineWidth: 3
    }

  });

constraintsRef.current.push(
  spring
);

springRef.current = spring;

// =========================
// PENDULUM CONSTRAINT
// =========================

const pendulumConstraint =
  Matter.Constraint.create({

    pointA: {
      x: 500,
      y: 50
    },

    bodyB: pendulumBall,

length: pendulumLengthRef.current,

    stiffness: 1,

    render: {
      strokeStyle: '#c084fc',
      lineWidth: 3
    }

  });

constraintsRef.current.push(
  pendulumConstraint
);

pendulumConstraintRef.current = pendulumConstraint;

// =========================
// BRIDGE PLANKS
// =========================

const bridgeStartX = 135;

const bridgeY = 420;

const plankCount = 10;

const plankWidth = 60;

for (
  let i = 0;
  i < plankCount;
  i++
) {

  const plank =
    Matter.Bodies.rectangle(

      bridgeStartX +
      i * plankWidth,

      bridgeY,

      plankWidth,

      20,

      {
        label: `bridge_${i}`,

        friction: 0.8,

        restitution: 0.1,

        density: 0.0012,

        render: {
          fillStyle: '#8b5e3c'
        }
      }

    );

  bridgeBodies.push(
    plank
  );

}

// =========================
// BRIDGE CONSTRAINTS
// =========================

for (
  let i = 0;
  i < bridgeBodies.length - 1;
  i++
) {

  const constraint =
    Matter.Constraint.create({

      bodyA:
        bridgeBodies[i],

      bodyB:
        bridgeBodies[i + 1],

      stiffness: 0.6,

      length: 8,

      damping: 0.03,

      render: {
        strokeStyle:
          '#fbbf24',

        lineWidth: 2
      }

    });

    constraint.customId =
  `bridge_constraint_${i}`;
  constraint.damage = 0;
  constraint.LastHitTime=0;
  

  bridgeConstraints.push(
    constraint
  );

}

// =========================
// BRIDGE ANCHORS
// =========================

const leftAnchor =
  Matter.Constraint.create({

    pointA: {
      x: bridgeStartX - 35,
      y: bridgeY
    },

    bodyB:
      bridgeBodies[0],

    stiffness: 1,

    length: 2

  });

const rightAnchor =
  Matter.Constraint.create({

    pointA: {
      x:
  bridgeStartX +
  plankWidth * (plankCount - 1) +
  35,

      y: bridgeY
    },

    bodyB:
      bridgeBodies[
        bridgeBodies.length - 1
      ],

    stiffness: 1,

    length: 2

  });

bridgeConstraints.push(
  leftAnchor,
  rightAnchor
);

    // =========================
    // WORLD
    // =========================

   const worldObjects = [

  ground,
  leftWall,
  rightWall,
  ceiling,

  box,
  ball,
  triangle

];
// =========================
// OPTIONAL SYSTEMS
// =========================



// =========================
// ADD TO WORLD
// =========================

Matter.Composite.add(
  engine.world,
  worldObjects
);


    // =========================
    // MOUSE
    // =========================

    const mouse =
      Matter.Mouse.create(
        render.canvas
      );

    const mouseConstraint =
      Matter.MouseConstraint.create(
        engine,
        {
          mouse,
          constraint: {
            stiffness: 0.2,
            render: {
              visible: false
            }
          }
        }
      );

    Matter.Composite.add(
      engine.world,
      mouseConstraint
    );

    // =========================
    // INITIAL VELOCITY
    // =========================

    Matter.Body.setVelocity(
      box,
      {
        x: 1.5,
        y: -1
      }
    );

    Matter.Body.setVelocity(
      ball,
      {
        x: -1,
        y: 0
      }
    );

    Matter.Body.setVelocity(
      triangle,
      {
        x: 0.8,
        y: -0.5
      }
    );

    Matter.Body.setVelocity(
  pendulumBall,
  {
    x: 4,
    y: 0
  }
);

    // =========================
    // KEYBOARD
    // =========================

    const handleKeyDown =
      (e) => {

        if (e.code === 'Space') {

          e.preventDefault();

          const targetBox =
            bodiesRef.current.box;

          if (!targetBox) return;

          Matter.Body.applyForce(
            targetBox,
            targetBox.position,
            {
              x: 0,
              y: -0.05
            }
          );

          socket.emit(
            'object_moved',
            {
              name: 'box',
              position:
                targetBox.position,
              velocity:
                targetBox.velocity
            }
          );

        }

      };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    // =========================
    // OBJECT UPDATE
    // =========================

    const handleObjectUpdate =
      (data) => {

        if (!isMounted) return;

        const body =
          bodiesRef.current[
            data.name
          ];

        if (!body) return;

        Matter.Body.setPosition(
          body,
          data.position
        );

        Matter.Body.setVelocity(
          body,
          data.velocity
        );

      };

 socket.on('room_state', (state) => {
  if (state.envState) {

    if (state.envState.gravity !== undefined) {
      engine.world.gravity.y = state.envState.gravity;
      setGravity(state.envState.gravity);
    }

    if (state.envState.wind !== undefined) {
      setWind(state.envState.wind);
      windRef.current = state.envState.wind;
    }
  }

  if (state.annotations) {
    setAnnotations(state.annotations);
  }
});


    socket.on(
      'update_object',
      handleObjectUpdate
    );

    // =========================
// PHYSICS SYNC RECEIVE
// =========================

socket.on('physics_sync', (data) => {

  data.bodies.forEach(savedBody => {

    const body =
      Object.values(
        bodiesRef.current
      ).find(
        b => b.label === savedBody.label
      );

    if (!body) return;

    Matter.Body.setPosition(
      body,
      savedBody.position
    );

    Matter.Body.setVelocity(
      body,
      savedBody.velocity
    );

    Matter.Body.setAngle(
      body,
      savedBody.angle
    );

  });

});

    // =========================
    // ENVIRONMENT UPDATE
    // =========================

    socket.on(
      'env_update',
      (data) => {

        if (
          data.gravity !==
          undefined
        ) {

          engine.world.gravity.y =
            data.gravity;

          setGravity(
            data.gravity
          );

        }
         if (data.wind !== undefined) {
    setWind(data.wind);
    windRef.current = data.wind;
  }

      }
    );

    // =========================
    // CURSORS
    // =========================

    socket.on(
      'mouse_update',
      (data) => {

        setCursors(prev => ({
          ...prev,
          [data.id]: data
        }));

      }
    );

    socket.on(
      'user_left',
      (id) => {

        setCursors(prev => {

          const updated = {
            ...prev
          };

          delete updated[id];

          return updated;

        });

      }
    );

    // =========================
    // ANNOTATIONS
    // =========================

    socket.on(
      'new_annotation',

      
      (note) => {

        setAnnotations(prev => [
          ...prev,
          note
        ]);

      }
    );

    // =========================
// PARTICIPANTS
// =========================

socket.on(
  'participants_update',
  (users) => {

    isHostRef.current =
  users[0]?.id === socket.id;

    setParticipants(users);

  }
);

    // =========================
    // DOUBLE CLICK
    // =========================

    const handleDoubleClick =
      () => {

        const clickedBodies =
          Matter.Query.point(
            Object.values(
              bodiesRef.current
            ),
            mouse.position
          );

        if (
          clickedBodies.length === 0
        ) return;

        const clickedBody =
          clickedBodies[0];

        const text = prompt(
          `Add annotation for ${clickedBody.label}`
        );

        if (!text) return;

        const note = {
          id: Date.now(),
          bodyLabel:
            clickedBody.label,
          text
        };

        setAnnotations(prev => [
          ...prev,
          note
        ]);

        socket.emit(
          'add_annotation',
          note
        );

      };

    render.canvas.addEventListener(
      'dblclick',
      handleDoubleClick
    );

    // =========================
    // MOUSE MOVE
    // =========================

    const handleMouseMove =
      (event) => {

        const rect =
          render.canvas.getBoundingClientRect();

        const mouseX =
          (event.clientX -
            rect.left) *
          (WIDTH / rect.width);

        const mouseY =
          (event.clientY -
            rect.top) *
          (HEIGHT / rect.height);

        socket.emit(
          'mouse_move',
          {
            x: mouseX,
            y: mouseY
          }
        );

        const draggedBody =
          mouseConstraint.body;

        if (draggedBody) {

          socket.emit(
            'object_moved',
            {
              name:
                draggedBody.label,
              position:
                draggedBody.position,
              velocity:
                draggedBody.velocity
            }
          );

          

        }

      };

    render.canvas.addEventListener(
      'mousemove',
      handleMouseMove
    );

    const handleCanvasClick =
  (event) => {

  

   if (
  buildModeRef.current === null
) {
  return;
}

    const rect =
      render.canvas.getBoundingClientRect();

    const mouseX =
      (event.clientX - rect.left) *
      (WIDTH / rect.width);

    const mouseY =
      (event.clientY - rect.top) *
      (HEIGHT / rect.height);

    const clickedBodies =
      Matter.Query.point(

        Object.values(
          bodiesRef.current
        ),

        {
          x: mouseX,
          y: mouseY
        }

      );

    if (
      clickedBodies.length === 0
    ) return;

    const clickedBody =
      clickedBodies[0];

      // =========================
// DELETE TOOL
// =========================

if (
  buildModeRef.current === 'delete'
) {

  constraintsRef.current.forEach(
    constraint => {

      if (
        constraint.bodyA === clickedBody ||
        constraint.bodyB === clickedBody
      ) {

        // remove from physics world
        Matter.Composite.remove(
          engine.world,
          constraint
        );

        // remove motors
        motorsRef.current =
  motorsRef.current.filter(motor => {

    return !(
      motor.rotor === clickedBody ||
      motor.stator === clickedBody
    );

  });
  Matter.Body.setAngularVelocity(
  clickedBody,
  0
);

      }

    }
  );

  // remove from array
  constraintsRef.current =
    constraintsRef.current.filter(
      constraint => {

        return (
          constraint.bodyA !== clickedBody &&
          constraint.bodyB !== clickedBody
        );

      }
    );

  return;
}
    const current =
      selectedBodiesRef.current;

  if (current.length === 0) {

  // Highlight selected body
  clickedBody.render.strokeStyle =
    '#ffffff';

  clickedBody.render.lineWidth = 6;

  const updatedSelection = [
    clickedBody
  ];

  setSelectedBodies(
    updatedSelection
  );

  selectedBodiesRef.current =
    updatedSelection;

  return;

}


    if (current.length === 1) {

      const bodyA = current[0];
      const bodyB = clickedBody;

   createConstraint(
  bodyA,
  bodyB,
  buildModeRef.current
);

// Reset highlights
selectedBodiesRef.current.forEach(body => {

  body.render.strokeStyle =
    '#000000';

  body.render.lineWidth = 1;

});

setSelectedBodies([]);
selectedBodiesRef.current = [];

    }

  };

  render.canvas.addEventListener(
  'click',
  handleCanvasClick
);


        // =========================
    // VECTOR OVERLAYS
    // =========================

    Matter.Events.on(
      render,
      'afterRender',
      () => {

       if (
  !showVelocityRef.current &&
  !showForceRef.current
) return;

        const context =
          render.context;

  const bodies =
  Object.values(
    bodiesRef.current
  ).filter(body => {

    if (!body) return false;

    return Matter.Composite.get(
      engine.world,
      body.id,
      'body'
    );

  });

        bodies.forEach(body => {

          const {
            x,
            y
          } = body.position;

          const {
            x: vx,
            y: vy
          } = body.velocity;

          const cachedForce =
  forceCacheRef.current[
    body.id
  ] || { x: 0, y: 0 };

const fx = cachedForce.x;
const fy = cachedForce.y;


          const velocityMagnitude =
  Math.sqrt(vx * vx + vy * vy);

const forceMagnitude =
  Math.sqrt(fx * fx + fy * fy);


         // =========================
// VECTOR SCALES
// =========================

const velocityScale = 12;

const forceVisualLength = 45;

// =========================
// VELOCITY VECTOR
// =========================

const endX =
  x + vx * velocityScale;

const endY =
  y + vy * velocityScale;

// =========================
// FORCE VECTOR
// =========================

let forceEndX = x;
let forceEndY = y;

if (forceMagnitude > 0.000001) {

  const normalizedFX =
    fx / forceMagnitude;

  const normalizedFY =
    fy / forceMagnitude;

  forceEndX =
    x +
    normalizedFX *
    forceVisualLength;

  forceEndY =
    y +
    normalizedFY *
    forceVisualLength;

}

          if (showVelocityRef.current) {

  // =========================
  // VELOCITY VECTOR
  // =========================

  context.beginPath();

  context.moveTo(
    x,
    y
  );

  context.lineTo(
    endX,
    endY
  );

  context.strokeStyle =
    '#22d3ee';

  context.lineWidth = 3;

  context.lineCap =
    'round';

  context.stroke();

  context.beginPath();

  context.arc(
    endX,
    endY,
    4,
    0,
    Math.PI * 2
  );

  context.fillStyle =
    '#22d3ee';

  context.fill();

}

if (showForceRef.current) {

  // =========================
  // FORCE VECTOR
  // =========================

  context.beginPath();

  context.moveTo(
    x,
    y
  );

  context.lineTo(
    forceEndX,
    forceEndY
  );

  context.strokeStyle =
    '#f97316';

  context.lineWidth = 4;

  context.stroke();

  context.beginPath();

  context.arc(
    forceEndX,
    forceEndY,
    4,
    0,
    Math.PI * 2
  );

  context.fillStyle =
    '#f97316';

  context.fill();

}


        });

      }
    );

     const createConstraint =
  (
    bodyA,
    bodyB,
    type
  ) => {

    let constraint;

    // =========================
    // ROPE
    // =========================

    if (type === 'rope') {

      constraint =
        Matter.Constraint.create({

          bodyA,
          bodyB,

          length: 120,

          stiffness: 0.9,
          damping: 0.1,

          render: {
            strokeStyle: '#c2b280',
            lineWidth: 4
          }

        });

    }
   
// =========================
// TRUE PIVOT
// =========================

if (type === 'pivot') {

  const group = Matter.Body.nextGroup(true);

  bodyA.collisionFilter.group = group;
  bodyB.collisionFilter.group = group;

  constraint = Matter.Constraint.create({

    bodyA,
    bodyB,

    pointA: { x: 0, y: 0 },
    pointB: { x: 0, y: 0 },

    length: 0,

    stiffness: 1,

    damping: 0.2,

    render: {
      strokeStyle: '#3b82f6',
      lineWidth: 4
    }

  });

}
    // =========================
    // SPRING
    // =========================

    if (type === 'spring') {

      constraint =
        Matter.Constraint.create({

          bodyA,
          bodyB,

          stiffness: 0.02,

          damping: 0.05,

          length: 150,

          render: {
            strokeStyle: '#facc15',
            lineWidth: 3
          }

        });

    }
// =========================
// TRUE MOTOR
// =========================

if (type === 'motor') {

  // prevent collisions between connected parts
  const group =
    Matter.Body.nextGroup(true);

  bodyA.collisionFilter.group = group;
  bodyB.collisionFilter.group = group;

  // hinge
  constraint =
    Matter.Constraint.create({

      bodyA,
      bodyB,

      pointA: { x: 0, y: 0 },
      pointB: { x: 0, y: 0 },

      length: 0,

      stiffness: 1,

      damping: 0,

      render: {
        strokeStyle: '#22c55e',
        lineWidth: 5
      }

    });

  // make bodyA the rotor
  motorsRef.current.push({

    rotor: bodyA,
    stator: bodyB,

    speed: 0.08

  });

}
  
    if (!constraint) return;

    constraintsRef.current.push(
      constraint
    );

    Matter.Composite.add(
      engine.world,
      constraint
    );

  };


    // =========================
    // PHYSICS DATA LOOP
    // =========================

    let lastUIUpdate = 0;

    Matter.Events.on(
      engine,
      'beforeUpdate',
      () => {

        const now = Date.now();

        // =========================
// NETWORK PHYSICS SYNC
// =========================

if (!window.lastNetworkSync) {
  window.lastNetworkSync = 0;
}

if (
  isHostRef.current &&
  now - window.lastNetworkSync > 70
) {

  socket.emit('physics_sync', {

    bodies: Object.values(
      bodiesRef.current
    ).map(body => ({

      label: body.label,

      position: body.position,

      velocity: body.velocity,

      angle: body.angle

    }))

  });

  window.lastNetworkSync = now;

}



        const bodies =
  Object.values(
    bodiesRef.current
  ).filter(body => {

    if (!body) return false;

    return Matter.Composite.get(
      engine.world,
      body.id,
      'body'
    );

  });


const shouldUpdateUI =
  now - lastUIUpdate > 50;


// =========================
// TRUE MOTOR SYSTEM
// =========================

motorsRef.current.forEach(motor => {

  // force constant spin
  Matter.Body.setAngularVelocity(
    motor.rotor,
    motor.speed
  );

});

          // =========================
// WIND FORCE
// =========================

bodies.forEach(body => {

  const gravityForce = body.mass *
  engine.world.gravity.y *
  0.001;

const appliedForce = {
x: windRef.current * 0.002,
  y: gravityForce
};

  // STORE FORCE
  forceCacheRef.current[body.id] =
    appliedForce;

  Matter.Body.applyForce(
    body,
    body.position,
    appliedForce
  );

});


       // =========================
// ADVANCED HOVER CONTROL
// =========================

if (
  isHoveringRef.current &&
  bodiesRef.current.box
) {

  const hoverBox =
    bodiesRef.current.box;

  // Save current height once
  if (
  hoverTargetRef.current === null
) {

  hoverTargetRef.current =
    Math.max(
      120,
      hoverBox.position.y - 250
    );

}

  const targetY =
    hoverTargetRef.current;

  const currentY =
    hoverBox.position.y;

  const error =
  targetY - currentY;

// =========================
// INTEGRAL
// =========================

integralRef.current += error;

// Prevent runaway buildup
integralRef.current =
  Math.max(
    -500,
    Math.min(
      500,
      integralRef.current
    )
  );

// =========================
// DERIVATIVE
// =========================

const dError =
  error -
  prevErrorRef.current;

// =========================
// PID CONSTANTS
// =========================



// =========================
// PID OUTPUT
// =========================

const thrust =
  (
    error * pidRef.current.kp
  ) +
  (
    integralRef.current *
    pidRef.current.ki
  ) +
  (
    dError *
    pidRef.current.kd
  );

// Clamp thrust
const clampedThrust =
  Math.max(
    -0.08,
    Math.min(
      0.08,
      thrust
    )
  );


  const hoverForce = {
  x: 0,
y: clampedThrust};

forceCacheRef.current[
  hoverBox.id
] = hoverForce;

Matter.Body.applyForce(
  hoverBox,
  hoverBox.position,
  hoverForce
);

  prevErrorRef.current =
    error;

}
        // =========================
        // HISTORY
        // =========================

        let totalEnergy = 0;

bodies.forEach(body => {

  const speed =
    Math.sqrt(
      body.velocity.x ** 2 +
      body.velocity.y ** 2
    );

  totalEnergy +=
    0.5 *
    body.mass *
    speed ** 2;

});

setHistory(prev => {

  const updated = [
    ...prev,
    {
      time: now,
      energy: Number(
        totalEnergy.toFixed(2)
      )
    }
  ];

  return updated.slice(-40);

});

        // =========================
        // DASHBOARD DATA
        // =========================

        bodies.forEach(body => {

  const speed =
    Math.sqrt(
      body.velocity.x ** 2 +
      body.velocity.y ** 2
    );

  const cachedForce =
    forceCacheRef.current[
      body.id
    ] || { x: 0, y: 0 };

  const forceMagnitude =
    Math.sqrt(
      cachedForce.x ** 2 +
      cachedForce.y ** 2
    );

  // =========================
  // STRESS VALUE
  // =========================

  const stress =
    speed * 1.2 +
    forceMagnitude * 1200;

  stressRef.current[
    body.id
  ] = stress;

  const stressLimit =
  body.stressLimit || 10;

const stressRatio =
  stress / stressLimit;

if (stressRatio < 0.4) {

  body.render.strokeStyle =
    '#22c55e';

  body.render.lineWidth = 2;

} else if (stressRatio < 0.7) {

  body.render.strokeStyle =
    '#eab308';

  body.render.lineWidth = 4;

} else if (stressRatio < 1) {

  body.render.strokeStyle =
    '#f97316';

  body.render.lineWidth = 6;

} else {

  body.render.strokeStyle =
    '#ef4444';

  body.render.lineWidth = 8;

}


});

// =========================
// STRUCTURAL FAILURE
// =========================

bridgeConstraints.forEach(constraint => {

  if (
  !Matter.Composite.get(
    engine.world,
    constraint.id,
    'constraint'
  )
) return;

  if (!constraint.bodyA || !constraint.bodyB) return;

  const dx =
    constraint.bodyA.position.x -
    constraint.bodyB.position.x;

  const dy =
    constraint.bodyA.position.y -
    constraint.bodyB.position.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  const stretch = Math.abs(distance - constraint.length);


  // ignore tiny vibrations (VERY IMPORTANT)
  if (stretch < 8) return;

  // throttle damage updates
  if (now - constraint.LastHitTime > 80) {

    constraint.damage += stretch * 0.004; // LOWER sensitivity

    constraint.LastHitTime = now;

    // clamp
    constraint.damage = Math.min(constraint.damage, 100);

    // color + thickness
    const stressColor =
      constraint.damage < 20 ? '#fbbf24' :
      constraint.damage < 40 ? '#f97316' :
      constraint.damage < 60 ? '#ef4444' :
      '#7f1d1d';

    constraint.render.strokeStyle = stressColor;
    constraint.render.lineWidth = 2 + constraint.damage / 25;

    // break condition
    if (constraint.damage > 60) {

      if (brokenConstraintsRef.current.has(constraint.customId)) return;

      brokenConstraintsRef.current.add(constraint.customId);

      Matter.Composite.remove(engine.world, constraint);
    }
  }
});

        const updatedData =
          bodies.map(body => {

            const speed =
              Math.sqrt(
                body.velocity.x ** 2 +
                body.velocity.y ** 2
              );

            const kineticEnergy =
              0.5 *
              body.mass *
              speed ** 2;

            return {
              name: body.label,
              velocityX:
                body.velocity.x.toFixed(
                  2
                ),
              velocityY:
                body.velocity.y.toFixed(
                  2
                ),
              positionX:
                body.position.x.toFixed(
                  2
                ),
              positionY:
                body.position.y.toFixed(
                  2
                ),
              kineticEnergy:
                kineticEnergy.toFixed(
                  2
                )
            };

          });

        if (shouldUpdateUI) {

  setPhysicsData(
    updatedData
  );

  lastUIUpdate = now;

}
      }
    );

    // =========================
    // START ENGINE
    // =========================


    Matter.Render.run(render);

    const runner =
      Matter.Runner.create();

    Matter.Runner.run(
      runner,
      engine
    );

    // =========================
    // CLEANUP
    // =========================

    return () => {

      isMounted = false;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );

      render.canvas.removeEventListener(
        'mousemove',
        handleMouseMove
      );

      render.canvas.removeEventListener(
        'dblclick',
        handleDoubleClick
      );

      render.canvas.removeEventListener(
  'click',
  handleCanvasClick
);

      socket.off(
        'update_object',
        handleObjectUpdate
      );

      socket.off('physics_sync');

      socket.off(
        'env_update'
      );

      socket.off(
        'mouse_update'
      );

      socket.off(
        'user_left'
      );

      socket.off(
        'new_annotation'
      );

    socket.off('room_state');

    socket.off(
  'participants_update'
);




      Matter.Render.stop(
        render
      );

      Matter.Runner.stop(
        runner
      );

      Matter.Engine.clear(
        engine
      );

      render.canvas.remove();

      render.textures = {};

    };

  }, []);

  useEffect(() => {

  if (!engineRef.current || !springRef.current) return;

  const world = engineRef.current.world;
  const spring = springRef.current;

  const exists = Matter.Composite.get(
    world,
    spring.id,
    'constraint'
  );

  if (showSpring && !exists) {

    Matter.Composite.add(world, spring);

  } else if (!showSpring && exists) {

    Matter.Composite.remove(world, spring);

  }

}, [showSpring]);

useEffect(() => {

  if (
    !engineRef.current ||
    !pendulumConstraintRef.current ||
    !bodiesRef.current.pendulum
  ) return;

  const world = engineRef.current.world;

  const pendulumBody =
    bodiesRef.current.pendulum;

  const pendulumConstraint =
    pendulumConstraintRef.current;

  const bodyExists = Matter.Composite.get(
    world,
    pendulumBody.id,
    'body'
  );

  if (showPendulum && !bodyExists) {

    Matter.Composite.add(world, [
      pendulumBody,
      pendulumConstraint
    ]);

  }

  if (!showPendulum && bodyExists) {

    Matter.Composite.remove(world, pendulumBody);
    Matter.Composite.remove(world, pendulumConstraint);

  }

}, [showPendulum]);

useEffect(() => {

  if (!engineRef.current) return;

  const world = engineRef.current.world;

  const bridgeBodies =
    bridgeBodiesRef.current;

  const bridgeConstraints =
    bridgeConstraintsSystemRef.current;

  if (!bridgeBodies.length) return;

  const exists = Matter.Composite.get(
    world,
    bridgeBodies[0].id,
    'body'
  );

  if (showBridge && !exists) {

    Matter.Composite.add(world, [
      ...bridgeBodies,
      ...bridgeConstraints
    ]);

  }

  if (!showBridge && exists) {

    bridgeBodies.forEach(body => {
      Matter.Composite.remove(world, body);
    });

    bridgeConstraints.forEach(constraint => {
      Matter.Composite.remove(world, constraint);
    });

  }

}, [showBridge]);

useEffect(() => {

  buildModeRef.current =
    buildMode;

}, [buildMode]);

useEffect(() => {

  selectedBodiesRef.current =
    selectedBodies;

}, [selectedBodies]);

// =========================
// LOAD SAVED EXPERIMENTS
// =========================

const fetchExperiments =
  async () => {

    try {

      const response =
        await fetch(
          'http://localhost:3001/api/experiments'
        );

      const data =
        await response.json();

      setSavedExperiments(
        data
      );

    } catch (error) {

      console.error(error);

    }

};

// =========================
// LOAD EXPERIMENT
// =========================

const loadExperiment =
  (experiment) => {

    if (
      !experiment?.worldState?.bodies
    ) return;

    // =========================
    // LOAD BODIES
    // =========================

    experiment.worldState.bodies.forEach(
      savedBody => {

        const body =
          Object.values(
            bodiesRef.current
          ).find(
            b =>
              b.label ===
              savedBody.label
          );

        if (!body) return;

        Matter.Body.setPosition(
          body,
          savedBody.position
        );

        Matter.Body.setVelocity(
          body,
          savedBody.velocity
        );

        Matter.Body.setAngle(
          body,
          savedBody.angle || 0
        );

      }
    );

    // =========================
    // LOAD WORLD SETTINGS
    // =========================

    if (
      experiment.worldState.gravity !==
      undefined
    ) {

      setGravity(
        experiment.worldState.gravity
      );

      engineRef.current.world.gravity.y =
        experiment.worldState.gravity;

    }

    if (
      experiment.worldState.wind !==
      undefined
    ) {

      setWind(
        experiment.worldState.wind
      );

      windRef.current =
        experiment.worldState.wind;

    }

    // =========================
    // LOAD ANNOTATIONS
    // =========================

    if (
      experiment.worldState.annotations
    ) {

      setAnnotations(
        experiment.worldState.annotations
      );

    }

    alert(
      'Experiment loaded successfully!'
    );

};

// =========================
// DELETE EXPERIMENT
// =========================

const deleteExperiment =
  async (id) => {

    try {

      await fetch(

        `http://localhost:3001/api/experiments/${id}`,

        {
          method: 'DELETE'
        }

      );

      // refresh list
      fetchExperiments();

      alert(
        'Experiment deleted successfully!'
      );

    } catch (error) {

      console.error(error);

      alert(
        'Failed to delete experiment'
      );

    }

};


// =========================
// SAVE EXPERIMENT
// =========================

const saveExperiment = async () => {

  try {

    const bodies =
      Object.values(
        bodiesRef.current
      ).map(body => ({

        label: body.label,

        position: body.position,

        velocity: body.velocity,

        angle: body.angle

      }));

    const constraints =
      constraintsRef.current.map(
        constraint => ({

          bodyA:
            constraint.bodyA?.label,

          bodyB:
            constraint.bodyB?.label,

          length:
            constraint.length,

          stiffness:
            constraint.stiffness

        })
      );

    const worldState = {

      gravity,

      wind,

      annotations,

      bodies,

      constraints

    };

    const response =
      await fetch(

        'http://localhost:3001/api/experiments',

        {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            name:
              `Experiment ${Date.now()}`,

            author:
              username || 'Anonymous',

            worldState

          })

        }

      );

    const data =
      await response.json();

    console.log(
      'Experiment Saved:',
      data
    );

    fetchExperiments();


    alert(
      'Experiment saved successfully!'
    );

  } catch (error) {

    console.error(error);

    alert(
      'Failed to save experiment'
    );

  }

};

const shareExperiment = (exp) => {
  const data = {
    gravity: exp.worldState.gravity,
    wind: exp.worldState.wind,
    bodies: exp.worldState.bodies
  };

  const encoded = btoa(JSON.stringify(data));

  const link = `${window.location.origin}/room/${roomID}?state=${encoded}`;

  navigator.clipboard.writeText(link);

  alert("Experiment share link copied!");
};



    // =========================
  // EXPORT CSV
  // =========================

  const exportToCSV = () => {

    if (history.length === 0) {

      alert(
        'No data recorded yet!'
      );

      return;

    }

    // CSV HEADER
    const headers = [
      'Timestamp',
      'Kinetic Energy (J)'
    ];

    // ROWS
    const rows = history.map(
      point => [
        point.time,
        point.energy
      ]
    );

    // BUILD CSV
    const csvContent =
      [headers, ...rows]
        .map(row =>
          row.join(',')
        )
        .join('\n');

    // DOWNLOAD
    const blob =
      new Blob(
        [csvContent],
        {
          type:
            'text/csv;charset=utf-8;'
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        'a'
      );

    link.setAttribute(
      'href',
      url
    );

    link.setAttribute(
      'download',
      `experiment_data_${Date.now()}.csv`
    );

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

  };

  // =========================
  // SIMPLE SVG GRAPH
  // =========================

  // =========================
  // PENDULUM TIME PERIOD CALCULATION
  // =========================
  // Convert pixels to an approximate meter scale (e.g., 100px = 1 meter)
  // Prevent division by zero if gravity is set to 0
  const effectiveGravity = gravity <= 0 ? 0.001 : gravity * 9.8; 
  const lengthInMeters = pendulumLength / 100;
  const pendulumTimePeriod = (2 * Math.PI * Math.sqrt(lengthInMeters / effectiveGravity)).toFixed(2);

  const graphWidth = 240;
  const graphHeight = 100;

  const maxEnergy =
    Math.max(
      ...history.map(
        h => h.energy
      ),
      1
    );

  const points = history
    .map((point, index) => {

      const x =
        (index /
          Math.max(
            history.length - 1,
            1
          )) *
        graphWidth;

      const y =
        graphHeight -
        (point.energy /
          maxEnergy) *
          graphHeight;

      return `${x},${y}`;

    })
    .join(' ');

  return (

    <div className="relative w-full h-screen bg-[#0a192f] overflow-hidden">

      {/* DASHBOARD */}
      <div className="absolute top-5 left-5 bg-black/80 text-white p-5 rounded-xl w-72 z-50 max-h-[95vh] overflow-y-auto">

        <h2 className="text-2xl font-bold mb-4">
          Physics Dashboard
        </h2>

        {/* PARTICIPANTS */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-green-400 font-bold mb-3">
    Participants
  </h3>

  <div className="space-y-2">

    {participants.map(user => (

      <div
        key={user.id}
        className="bg-gray-800 px-3 py-2 rounded text-sm flex justify-between items-center"
      >

        <span>
          {user.username}
        </span>

        <div className="w-2 h-2 rounded-full bg-green-400" />

      </div>

    ))}

  </div>

</div>


{/* COLLABORATION */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-blue-400 font-bold mb-3">
    Collaboration
  </h3>

  <div className="bg-gray-800 p-2 rounded text-xs break-all mb-3">

    Room ID:
    {' '}
    {roomID}

  </div>

  <button
onClick={() => {
  const data = generateShareData();

  const encoded = btoa(JSON.stringify(data));

  const inviteLink =
    `${window.location.origin}/room/${roomID}?state=${encoded}`;

  navigator.clipboard.writeText(inviteLink);

  alert("Sharable lab link copied!");
}}


    className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded text-sm font-bold"
  >

    Copy Invite Code

  </button>

</div>


        

        {/* WORLD SETTINGS */}
        <div className="mb-6 pb-4 border-b border-gray-700">

          <h3 className="text-blue-400 font-bold mb-2">
            World Settings
          </h3>

          <label className="block text-xs mb-2">

            Gravity:
            {' '}
            {gravity.toFixed(2)}

          </label>

          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={gravity}
            onChange={(e) => {

              const value =
                parseFloat(
                  e.target.value
                );

              setGravity(value);

              if (
                engineRef.current
              ) {

                engineRef.current.world.gravity.y =
                  value;

              }

              socket.emit(
                'env_change',
                {
                  gravity: value
                }
              );

            }}
            className="w-full"
          />

        </div>


        {/* ATMOSPHERIC CONDITIONS */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-orange-400 font-bold mb-2">
    Atmospheric Conditions
  </h3>

  <label className="block text-xs mb-2">

    Crosswind:
    {' '}

    {
      wind > 0
        ? 'East'
        : wind < 0
        ? 'West'
        : 'Calm'
    }

  </label>

  <input
    type="range"
    min="-5"
    max="5"
    step="0.5"
    value={wind}
    onChange={(e) => {
  const value = parseFloat(e.target.value);
  setWind(value);
  windRef.current = value;
}}

    className="w-full accent-orange-500"
  />

</div>

<div></div>

 {/* VECTOR TOGGLES */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-cyan-400 font-bold mb-3">
    Vector Overlays
  </h3>

  {/* VELOCITY */}

  <label className="flex items-center justify-between text-xs mb-3">

    <div className="flex items-center gap-2">

      <div className="w-4 h-1 bg-cyan-400" />

      <span>Velocity Vectors</span>

    </div>

    <input
      type="checkbox"
      checked={showVelocityVectors}
  onChange={(e) => {

  const checked = e.target.checked;

  setShowVelocityVectors(checked);
  showVelocityRef.current = checked;

}}
    />

  </label>

  {/* FORCE */}

  <label className="flex items-center justify-between text-xs">

    <div className="flex items-center gap-2">

      <div className="w-4 h-1 bg-orange-500" />

      <span>Force Vectors</span>

    </div>

    <input
      type="checkbox"
      checked={showForceVectors}
      onChange={(e) => {

  const checked = e.target.checked;

  setShowForceVectors(checked);
  showForceRef.current = checked;

}}
    />

  </label>

</div>

        {/* ENERGY GRAPH */}
        <div className="mb-6 pb-4 border-b border-gray-700">

          <h3 className="text-green-400 font-bold mb-2">
            Kinetic Energy
          </h3>

          <svg
            width={graphWidth}
            height={graphHeight}
            className="bg-gray-900 rounded"
          >

            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={points}
            />

          </svg>


                    <button
            onClick={exportToCSV}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
          >

            Export Session Data (.CSV)

          </button>

          <button
  onClick={saveExperiment}
  className="w-full mt-3 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
>

  Save Experiment

</button>

        </div>


{/* CONSTRAINT BUILDER */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-red-400 font-bold mb-4">
    Constraint Builder
  </h3>

  <div className="grid grid-cols-2 gap-2">

    <button
  className={`py-2 rounded text-xs ${
    buildMode === 'rope'
      ? 'bg-blue-600'
      : 'bg-gray-700'
  }`}
  onClick={() => {
    setBuildMode('rope');
    buildModeRef.current = 'rope';
  }}
>
  Rope
</button>

    <button
  className={`py-2 rounded text-xs ${
    buildMode === 'pivot'
      ? 'bg-blue-600'
      : 'bg-gray-700'
  }`}
  onClick={() => {
    setBuildMode('pivot');
    buildModeRef.current = 'pivot';
  }}
>
  Pivot
</button>

    <button
  className={`py-2 rounded text-xs ${
    buildMode === 'spring'
      ? 'bg-blue-600'
      : 'bg-gray-700'
  }`}
  onClick={() => {
    setBuildMode('spring');
    buildModeRef.current = 'spring';
  }}
>
  Spring
</button>

    <button
  className={`py-2 rounded text-xs ${
    buildMode === 'motor'
      ? 'bg-blue-600'
      : 'bg-gray-700'
  }`}
  onClick={() => {
    setBuildMode('motor');
    buildModeRef.current = 'motor';
  }}
>
  Motor
</button>

  </div>

  <button
 onClick={() => {

  // Reset selected body visuals
  selectedBodiesRef.current.forEach(body => {

    body.render.strokeStyle =
      '#000000';

    body.render.lineWidth = 1;

  });

  buildModeRef.current = null;
  selectedBodiesRef.current = [];

  setBuildMode(null);
  setSelectedBodies([]);

}}


    className="w-full mt-3 py-2 rounded bg-gray-800 text-xs"
  >
    Cancel Tool
  </button>

  <button
  onClick={() => {
    setBuildMode('delete');
    buildModeRef.current = 'delete';
  }}
  className={`w-full mt-2 py-2 rounded text-xs ${
    buildMode === 'delete'
      ? 'bg-red-600'
      : 'bg-gray-700'
  }`}
>
  Delete Constraints
</button>

</div>

       {/* EXPERIMENT SYSTEMS */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-yellow-400 font-bold mb-4">
    Experiment Systems
  </h3>

{/* PENDULUM */}

  <label className="flex items-center justify-between text-xs mb-3">

    <span>Pendulum</span>

    <input
      type="checkbox"
      checked={showPendulum}
   onChange={(e) => {
  setShowPendulum(e.target.checked);
  showPendulumRef.current = e.target.checked;
}}
    />

  </label>

  <label className="block text-xs mb-2 mt-3">
  Pendulum Length: {pendulumLength}px
</label>

<input
  type="range"
  min="80"
  max="400"
  step="5"
  value={pendulumLength}
  onChange={(e) => {
    const value = parseFloat(e.target.value);

    setPendulumLength(value);
    pendulumLengthRef.current = value;

    if (pendulumConstraintRef.current) {
      pendulumConstraintRef.current.length = value;
    }
  }}
  className="w-full accent-purple-500"
/>

<label className="block text-xs mb-2 mt-2">
  Calculated Time Period (T): <span className="font-bold">{gravity <= 0 ? '∞' : `${pendulumTimePeriod}s`}</span>
</label>

  {/* BRIDGE */}

  <label className="flex items-center justify-between text-xs">

    <span>Bridge</span>

    <input
      type="checkbox"
      checked={showBridge}
      onChange={(e) => {
  setShowBridge(e.target.checked);
  showBridgeRef.current = e.target.checked;
}}
    />

  </label>

  <button
  onClick={rebuildBridge}
  className="w-full mt-2 bg-yellow-700 hover:bg-yellow-600 py-2 rounded text-xs font-bold"
>
  Rebuild Bridge
</button>



               {/* HOVER MODE */}

<div className="border-t border-gray-700 mt-4 pt-4 mb-6">

          <button
            onClick={() => {

  const newState = !isHovering;

  setIsHovering(newState);
  isHoveringRef.current = newState;

  if (!newState) {

    hoverTargetRef.current = null;
    integralRef.current = 0;
    prevErrorRef.current = 0;

  }

}}
            className={`w-full py-2 rounded text-sm font-bold transition-colors ${
              isHovering
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >

            {isHovering
              ? 'Hover Mode: ON'
              : 'Hover Mode: OFF'}

          </button>

        </div>


{/* PID TUNING */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-pink-400 font-bold mb-4">
    PID Controller
  </h3>

  {/* KP */}

  <label className="block text-xs mb-1">
    Kp: {kp.toFixed(4)}
  </label>

  <input
    type="range"
    min="0"
    max="0.01"
    step="0.0001"
    value={kp}
    onChange={(e) => {
  const value = parseFloat(e.target.value);
  setKp(value);
  pidRef.current.kp = value;
}}

    className="w-full mb-4 accent-pink-500"
  />

  {/* KI */}

  <label className="block text-xs mb-1">
    Ki: {ki.toFixed(6)}
  </label>

  <input
    type="range"
    min="0"
    max="0.00005"
    step="0.000001"
    value={ki}
    onChange={(e) => {
  const value = parseFloat(e.target.value);
  setKi(value);
  pidRef.current.ki = value;
}}

    className="w-full mb-4 accent-green-500"
  />

  {/* KD */}

  <label className="block text-xs mb-1">
    Kd: {kd.toFixed(4)}
  </label>

  <input
    type="range"
    min="0"
    max="0.05"
    step="0.0005"
    value={kd}
    onChange={(e) => {
  const value = parseFloat(e.target.value);
  setKd(value);
  pidRef.current.kd = value;
}}

    className="w-full accent-cyan-500"
  />

</div>


{/* MATERIAL SYSTEM */}

<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-cyan-400 font-bold mb-4">
    Material System
  </h3>

  <select
    value={selectedMaterial}
    onChange={(e) =>
      setSelectedMaterial(
        e.target.value
      )
    }
    className="w-full bg-gray-800 text-white p-2 rounded mb-3"
  >

    <option value="wood">
      Wood
    </option>

    <option value="steel">
      Steel
    </option>

    <option value="rubber">
      Rubber
    </option>

    <option value="ice">
      Ice
    </option>

  </select>

  <button
    onClick={() => {

      Object.values(
        bodiesRef.current
      ).forEach(body => {

        applyMaterialToBody(
          body,
          selectedMaterial
        );

      });

    }}
    className="w-full bg-cyan-600 hover:bg-cyan-500 py-2 rounded text-sm font-bold"
  >

    Apply Material

  </button>

  <button
  onClick={() => {
    Object.values(bodiesRef.current).forEach(body => {
      body.friction = 0.05;
      body.restitution = 0.8;
      Matter.Body.setDensity(body, 0.001);
      body.stressLimit = 10;
      body.render.fillStyle =
        body.label === 'box' ? '#3b82f6' :
        body.label === 'ball' ? '#ef4444' :
        body.label === 'triangle' ? '#10b981' :
        '#a855f7';
    });
  }}
  className="w-full mt-2 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-bold"
>
  Reset Material
</button>

</div>




{/* LAB TEMPLATES */}
<div className="mb-6 pb-4">
  <h3 className="text-indigo-400 font-bold mb-3">
    Lab Templates
  </h3>

  <div className="grid grid-cols-2 gap-2">

    <button
      onClick={() => applyTemplate("gravity_lab")}
      className="bg-indigo-600 py-1 rounded text-xs"
    >
      Gravity Lab
    </button>

    <button
      onClick={() => applyTemplate("calm_lab")}
      className="bg-indigo-600 py-1 rounded text-xs"
    >
      Calm Lab
    </button>

    <button
      onClick={() => applyTemplate("storm_lab")}
      className="bg-indigo-600 py-1 rounded text-xs"
    >
      Storm Lab
    </button>

    <button
      onClick={() => applyTemplate("chaos_lab")}
      className="bg-indigo-600 py-1 rounded text-xs"
    >
      Chaos Lab
    </button>
    
  </div>

     <button
  onClick={cancelTemplate}
  className="w-full mt-3 bg-gray-800 hover:bg-gray-700 py-2 rounded text-xs text-white border border-gray-600"
>
  Cancel Preset / Reset Lab
</button>


</div>



 
 

</div>
 
  

{/* LAB GALLERY */}
<div className="mb-6 pb-4 border-b border-gray-700">

  <h3 className="text-purple-400 font-bold mb-4">
    Lab Gallery
  </h3>

  <div className="grid grid-cols-1 gap-3">

<p className="text-xs text-gray-500 mb-2">Saved Experiments</p>


  {savedExperiments.map(exp => (
    <div
      key={exp._id}
      className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-purple-500 transition shadow-md"
    >

      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-white text-sm">
            {exp.name}
          </p>
          <p className="text-xs text-gray-400">
            by {exp.author}
          </p>
        </div>

        <span className="text-[10px] text-gray-500">
          {new Date(exp.createdAt).toLocaleString()}
        </span>
      </div>

      {/* TAGS / METRICS */}
      <div className="flex gap-2 text-[11px] text-gray-300 mb-3">
        <span className="bg-gray-800 px-2 py-1 rounded">
          🌍 g: {exp.worldState.gravity}
        </span>
        <span className="bg-gray-800 px-2 py-1 rounded">
          💨 wind: {exp.worldState.wind}
        </span>
        <span className="bg-gray-800 px-2 py-1 rounded">
          🧱 bodies: {exp.worldState.bodies?.length}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        <button
          onClick={() => loadExperiment(exp)}
          className="flex-1 bg-blue-600 hover:bg-blue-500 py-1.5 rounded text-xs"
        >
          Load
        </button>

        <button
          onClick={() => deleteExperiment(exp._id)}
          className="flex-1 bg-red-600 hover:bg-red-500 py-1.5 rounded text-xs"
        >
          Delete
        </button>

        <button
          onClick={() => shareExperiment(exp)}
          className="flex-1 bg-green-600 hover:bg-green-500 py-1.5 rounded text-xs"
        >
          Share
        </button>
      </div>

    </div>
  ))}
</div>

</div>

        {/* OBJECT DATA */}
        {physicsData.map(
          (item, index) => (

            <div
              key={index}
              className="mb-5 border-b border-gray-700 pb-3"
            >

              <h3 className="text-lg font-semibold mb-2 capitalize">
                {item.name}
              </h3>

              <p>
                Velocity X:
                {' '}
                {item.velocityX}
              </p>

              <p>
                Velocity Y:
                {' '}
                {item.velocityY}
              </p>

              <p>
                Position X:
                {' '}
                {item.positionX}
              </p>

              <p>
                Position Y:
                {' '}
                {item.positionY}
              </p>

              <p>
                Kinetic Energy:
                {' '}
                {item.kineticEnergy}
              </p>

            </div>

          )
        )}

      </div>

      {/* PHYSICS WORLD */}
      <div className="absolute inset-0 flex items-center justify-center">

        <div className="relative w-[800px] h-[600px]">

          {/* CANVAS */}
         <div
  ref={sceneRef}
  className="absolute inset-0 pointer-events-auto"
/>
          {/* CURSORS */}
          {Object.values(
            cursors
          ).map(cursor => (

            <div
              key={cursor.id}
              className="absolute pointer-events-none z-50"
              style={{
                left: cursor.x,
                top: cursor.y,
                transform:
                  'translate(-50%, -50%)'
              }}
            >

              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />

            </div>

          ))}

          {/* ANNOTATIONS */}
          {annotations.map(
            note => {

              const body =
                bodiesRef.current[
                  note.bodyLabel
                ];

              if (!body)
                return null;

              return (

                <div
                  key={note.id}
                  className="absolute z-40 bg-yellow-200 text-black text-xs px-2 py-1 rounded shadow-lg border-l-4 border-yellow-500 pointer-events-none"
                  style={{
                    left:
                      body.position.x,
                    top:
                      body.position.y -
                      50
                  }}
                >

                  <strong>
                    {
                      note.bodyLabel
                    }
                  </strong>

                  : {note.text}

                </div>

              );

            }
          )}

        </div>

      </div>

    </div>

  );

};

export default PhysicsCanvas;