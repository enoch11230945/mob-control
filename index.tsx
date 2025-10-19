import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- CONFIGURATION ---
const EQUIPMENT_CONFIG = {
    w_common_1: { name: 'Pistol', type: 'weapon', rarity: 'common', bonus: { baseUnitPower: 5 } },
    w_rare_1: { name: 'Rifle', type: 'weapon', rarity: 'rare', bonus: { baseUnitPower: 10 } },
    w_epic_1: { name: 'Railgun', type: 'weapon', rarity: 'epic', bonus: { baseUnitPower: 25 } },
    m_common_1: { name: 'Small Clip', type: 'magazine', rarity: 'common', bonus: { baseUnitsPerShot: 1 } },
    m_rare_1: { name: 'Large Clip', type: 'magazine', rarity: 'rare', bonus: { baseUnitsPerShot: 2 } },
    h_common_1: { name: 'Commander Helm', type: 'helmet', rarity: 'common', bonus: { rewardMultiplier: 1.1 } },
    mech_common_1: { name: 'Standard Mech', type: 'mechanism', rarity: 'common', bonus: { baseFireRate: 2 } },
    mech_rare_1: { name: 'Auto Loader', type: 'mechanism', rarity: 'rare', bonus: { baseFireRate: 3 } },
};

const TALENT_CONFIG = {
    power: { name: 'Power', maxLevel: 10, cost: (level) => 100 * Math.pow(1.1, level), bonus: { multiplicative: { power: 0.05 } } },
    fireRate: { name: 'Fire Rate', maxLevel: 10, cost: (level) => 150 * Math.pow(1.1, level), bonus: { multiplicative: { fireRate: 0.05 } } },
};

const HERO_CONFIG = {
    gateProphet: { name: 'Gate Prophet', cost: 5000, bonus: { gateModifiers: { multiplyBonus: 1 } } },
};

type Reward = { type: 'gold', amount: number } | { type: 'item', id: keyof typeof EQUIPMENT_CONFIG };

const SEASON_PASS_CONFIG = {
    durationDays: 30,
    xpPerWin: 100,
    levels: [
        { xp: 100, free: { type: 'gold', amount: 100 } },
        { xp: 200, free: { type: 'gold', amount: 200 }, premium: { type: 'item', id: 'w_common_1' } },
        { xp: 300, free: { type: 'item', id: 'm_common_1' } },
        { xp: 400, free: { type: 'gold', amount: 500 }, premium: { type: 'item', id: 'w_rare_1' } },
    ]
};

const GACHA_CONFIG = {
    commonChest: {
        cost: 200,
        pool: [
            { id: 'w_common_1', weight: 10 },
            { id: 'm_common_1', weight: 10 },
            { id: 'h_common_1', weight: 10 },
            { id: 'mech_common_1', weight: 10 },
            { id: 'w_rare_1', weight: 3 },
            { id: 'm_rare_1', weight: 3 },
            { id: 'mech_rare_1', weight: 3 },
            { id: 'w_epic_1', weight: 1 },
        ]
    }
};

const LEVELS = [
    { duration: 60, enemyHealth: 1000, timeline: [{ time: 2, type: 'add', value: 10, y: 150 }] },
    { duration: 60, enemyHealth: 2000, timeline: [{ time: 2, type: 'multiply', value: 2, y: 100 }, { time: 5, type: 'add', value: 20, y: 250 }] },
];

// --- TYPE DEFINITIONS ---
type EquipmentType = 'weapon' | 'magazine' | 'mechanism' | 'helmet';
type Rarity = 'common' | 'rare' | 'epic';
interface GameItem { uid: number; id: keyof typeof EQUIPMENT_CONFIG; }
interface PlayerData {
    gold: number;
    inventory: GameItem[];
    equipped: { [key in EquipmentType]?: number };
    talents: { [key: string]: number };
    unlockedHeroes: string[];
    seasonPass: { xp: number; premium: boolean; claimedUntil: { free: number, premium: number } };
    maxLevelReached: number;
    isFirstVisit: boolean;
}
interface FinalRunConfig {
    baseFireRate: number;
    baseUnitsPerShot: number;
    baseUnitPower: number;
    additiveBonuses: { [key: string]: number };
    multiplicativeBonuses: { [key: string]: number };
    gateModifiers: { [key: string]: number };
    rewardMultiplier: number;
}
type ActiveGameObject = { id: number; el: HTMLElement; x: number; y: number; vx: number; vy: number; type: 'unit' | 'gate' | 'vfx'; value?: number, displayValue?: string, hitGate?: boolean };

// --- DATA MANAGEMENT ---
const dataManager = {
    get: (): PlayerData => {
        const data = localStorage.getItem('playerData');
        if (data) return JSON.parse(data);
        return {
            gold: 1000,
            inventory: [{ uid: 1, id: 'w_common_1' }, { uid: 2, id: 'm_common_1' }, { uid: 3, id: 'mech_common_1' }],
            equipped: { weapon: 1, magazine: 2, mechanism: 3 },
            talents: {},
            unlockedHeroes: [],
            seasonPass: { xp: 0, premium: false, claimedUntil: { free: -1, premium: -1 } },
            maxLevelReached: 0,
            isFirstVisit: true,
        };
    },
    set: (data: PlayerData) => {
        localStorage.setItem('playerData', JSON.stringify(data));
    }
};

// --- SYSTEMS ---
const talentSystem = (playerData: PlayerData) => {
    const bonuses = { additive: {}, multiplicative: {} };
    // Implementation for calculating talent bonuses
    return bonuses;
};

const heroSystem = (playerData: PlayerData) => {
    const bonuses = { gateModifiers: {} };
    // Implementation for calculating hero bonuses
    return bonuses;
};

// --- OBJECT POOL ---
class PoolManager {
    pools: { [key: string]: { inactive: HTMLElement[], active: Map<number, ActiveGameObject> } } = {};
    nextId = 0;

    createPool(name: string, size: number, elementCreator: () => HTMLElement, container: HTMLElement) {
        this.pools[name] = { inactive: [], active: new Map() };
        for (let i = 0; i < size; i++) {
            const el = elementCreator();
            container.appendChild(el);
            this.pools[name].inactive.push(el);
        }
    }

    get(name: string): { el: HTMLElement; id: number } | null {
        const pool = this.pools[name];
        if (pool.inactive.length > 0) {
            const el = pool.inactive.pop()!;
            const id = this.nextId++;
            return { el, id };
        }
        return null;
    }

    release(name: string, obj: ActiveGameObject) {
        const pool = this.pools[name];
        pool.active.delete(obj.id);
        pool.inactive.push(obj.el);
        obj.el.style.transform = 'translate(-9999px, -9999px)';
    }

    getActive(name: string) { return this.pools[name].active; }
    addToActive(name: string, id: number, obj: Omit<ActiveGameObject, 'id'>) {
        this.pools[name].active.set(id, { ...obj, id });
    }

    cleanup(name:string) {
        const pool = this.pools[name];
        if (pool) {
            pool.active.forEach(obj => this.release(name, obj));
        }
    }
}

// --- SOUND MANAGER ---
const soundManager = {
    play: (sound: string) => { /* Sound logic placeholder */ }
};

// --- REACT COMPONENTS ---
const Game: React.FC<{ runConfig: FinalRunConfig, onGameOver: (win: boolean, gold: number) => void, level: any }> = ({ runConfig, onGameOver, level }) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const pools = useRef(new PoolManager());
    const lastFrameTime = useRef(performance.now());
    const fireCooldown = useRef(0);
    const gameTime = useRef(0);
    const nextEventIndex = useRef(0);
    
    useEffect(() => {
        const gameContainer = gameContainerRef.current;
        if (!gameContainer) return;
        
        const poolContainer = document.createElement('div');
        poolContainer.className = 'pool-container';
        gameContainer.appendChild(poolContainer);

        pools.current.createPool('unit', 200, () => {
            const el = document.createElement('div');
            el.className = 'unit pooled-object';
            return el;
        }, poolContainer);
        pools.current.createPool('gate', 20, () => {
            const el = document.createElement('div');
            el.className = 'gate pooled-object';
            return el;
        }, poolContainer);
         pools.current.createPool('vfx', 50, () => {
            const el = document.createElement('div');
            el.className = 'vfx pooled-object';
            return el;
        }, poolContainer);

        let animationFrameId: number;
        let enemyHealth = level.enemyHealth;
        const cannonEl = gameContainer.querySelector('.cannon') as HTMLElement;
        const healthBarEl = gameContainer.querySelector('.enemy-health-bar') as HTMLElement;

        const gameLoop = (now: number) => {
            const dt = (now - lastFrameTime.current) / 1000;
            lastFrameTime.current = now;
            gameTime.current += dt;

            // Firing logic
            fireCooldown.current -= dt;
            if (fireCooldown.current <= 0) {
                fireCooldown.current = 1 / runConfig.baseFireRate;
                const unitPoolObj = pools.current.get('unit');
                if (unitPoolObj) {
                    gameContainer.querySelector('.game-world')?.appendChild(unitPoolObj.el);
                    pools.current.addToActive('unit', unitPoolObj.id, {
                        el: unitPoolObj.el,
                        x: 50, y: parseFloat(cannonEl.style.top), vx: 200, vy: 0,
                        type: 'unit'
                    });
                }
            }

            // Timeline logic
            if (nextEventIndex.current < level.timeline.length && gameTime.current >= level.timeline[nextEventIndex.current].time) {
                const event = level.timeline[nextEventIndex.current];
                const gatePoolObj = pools.current.get('gate');
                if (gatePoolObj) {
                    gameContainer.querySelector('.game-world')?.appendChild(gatePoolObj.el);
                    gatePoolObj.el.className = `gate gate-${event.type}`;
                    gatePoolObj.el.textContent = `${event.type === 'add' ? '+' : 'x'}${event.value}`;
                    pools.current.addToActive('gate', gatePoolObj.id, {
                        el: gatePoolObj.el,
                        x: 800, y: event.y, vx: -100, vy: 0,
                        type: 'gate', value: event.value
                    });
                }
                nextEventIndex.current++;
            }

            // Update & Collision
            const units = pools.current.getActive('unit');
            const gates = pools.current.getActive('gate');
            
            units.forEach(unit => {
                unit.x += unit.vx * dt;
                
                if (!unit.hitGate) {
                    gates.forEach(gate => {
                        if (Math.abs(unit.x - gate.x) < 10 && Math.abs(unit.y - gate.y) < 30) {
                            unit.hitGate = true;
                             if(gate.el.classList.contains('gate-add')) {
                                for(let i = 0; i < gate.value!; i++) {
                                    const newUnitPoolObj = pools.current.get('unit');
                                    if(newUnitPoolObj) {
                                         gameContainer.querySelector('.game-world')?.appendChild(newUnitPoolObj.el);
                                         pools.current.addToActive('unit', newUnitPoolObj.id, {
                                            el: newUnitPoolObj.el,
                                            x: unit.x + 10, y: unit.y + (Math.random() - 0.5) * 20,
                                            vx: unit.vx, vy: 0, type: 'unit'
                                         });
                                    }
                                }
                            } else { // Multiply
                                for (let i = 0; i < gate.value!; i++) {
                                     const newUnitPoolObj = pools.current.get('unit');
                                    if(newUnitPoolObj) {
                                         gameContainer.querySelector('.game-world')?.appendChild(newUnitPoolObj.el);
                                         pools.current.addToActive('unit', newUnitPoolObj.id, {
                                            el: newUnitPoolObj.el,
                                            x: unit.x + 10, y: unit.y + (Math.random() - 0.5) * 20,
                                            vx: unit.vx, vy: 0, type: 'unit'
                                         });
                                    }
                                }
                                pools.current.release('unit', unit);
                            }
                        }
                    });
                }
                
                if (unit.x > 750) {
                    enemyHealth -= runConfig.baseUnitPower;
                    healthBarEl.style.height = `${Math.max(0, enemyHealth / level.enemyHealth * 100)}%`;
                    const vfxPoolObj = pools.current.get('vfx');
                    if(vfxPoolObj) {
                        gameContainer.querySelector('.game-world')?.appendChild(vfxPoolObj.el);
                        pools.current.addToActive('vfx', vfxPoolObj.id, { el: vfxPoolObj.el, x: 750, y: unit.y, vx: 0, vy: 0, type: 'vfx' });
                        vfxPoolObj.el.style.transform = `translate(${750}px, ${unit.y}px)`;
                        setTimeout(() => pools.current.release('vfx', { id: vfxPoolObj.id, ...pools.current.getActive('vfx').get(vfxPoolObj.id)! }), 300);
                    }
                    pools.current.release('unit', unit);
                }

                if (unit.el) unit.el.style.transform = `translate(${unit.x}px, ${unit.y}px)`;
            });

            gates.forEach(gate => {
                gate.x += gate.vx * dt;
                if (gate.x < -100) pools.current.release('gate', gate);
                if (gate.el) gate.el.style.transform = `translate(${gate.x}px, ${gate.y}px)`;
            });

            // Win/Loss Condition
            if (enemyHealth <= 0) {
                soundManager.play('win');
                onGameOver(true, 100 * runConfig.rewardMultiplier);
                cancelAnimationFrame(animationFrameId);
                return;
            }
            if (gameTime.current > level.duration) {
                soundManager.play('lose');
                onGameOver(false, 0);
                cancelAnimationFrame(animationFrameId);
                return;
            }

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);

        return () => {
            cancelAnimationFrame(animationFrameId);
             if (gameContainer && poolContainer.parentNode === gameContainer) {
                gameContainer.removeChild(poolContainer);
            }
            pools.current.cleanup('unit');
            pools.current.cleanup('gate');
            pools.current.cleanup('vfx');
        };
    }, [runConfig, onGameOver, level]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const cannonEl = gameContainerRef.current?.querySelector('.cannon') as HTMLElement;
        if (cannonEl) {
            cannonEl.style.top = `${Math.max(20, Math.min(y, rect.height - 20))}px`;
        }
    };

    return (
        <div className="game-container" ref={gameContainerRef} onMouseMove={handleMouseMove}>
            <div className="game-info">Level: {level.id + 1} | Time: {level.duration}s</div>
            <div className="enemy-base">
                 <div className="enemy-health-bar-container"><div className="enemy-health-bar"></div></div>
            </div>
            <div className="game-world">
                <div className="cannon" style={{ top: '50%' }}></div>
            </div>
        </div>
    );
};

const Menu: React.FC<{ playerData: PlayerData, setPlayerData: (data: PlayerData) => void, onStartGame: (level: number) => void }> = ({ playerData, setPlayerData, onStartGame }) => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [currentLevel, setCurrentLevel] = useState(0);

    // All panel components and their logic would go here
    const renderPanel = () => {
        // This would render InventoryPanel, TalentsPanel etc.
        return <div>Panel for {activeTab}</div>;
    }

    return (
        <div className="menu-container">
            <div className="player-stats">
                <span>💰 {playerData.gold}</span>
            </div>
            <div className="level-selector">
                 <button onClick={() => setCurrentLevel(Math.max(0, currentLevel - 1))}>&lt;</button>
                 <span>Level {currentLevel + 1}</span>
                 <button onClick={() => setCurrentLevel(Math.min(playerData.maxLevelReached + 1, LEVELS.length - 1, currentLevel + 1))}>&gt;</button>
            </div>
            <button className="action-button" onClick={() => onStartGame(currentLevel)}>Start Battle</button>
            <div className="tabs">
                <button className={`tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Inventory</button>
                <button className={`tab ${activeTab === 'talents' ? 'active' : ''}`} onClick={() => setActiveTab('talents')}>Talents</button>
                <button className={`tab ${activeTab === 'heroes' ? 'active' : ''}`} onClick={() => setActiveTab('heroes')}>Heroes</button>
                <button className={`tab ${activeTab === 'pass' ? 'active' : ''}`} onClick={() => setActiveTab('pass')}>Pass</button>
                 <button className={`tab ${activeTab === 'gacha' ? 'active' : ''}`} onClick={() => setActiveTab('gacha')}>Gacha</button>
            </div>
            <div className="panel">{renderPanel()}</div>
        </div>
    );
};

const FtueOverlay: React.FC<{ step: number, onNext: () => void }> = ({ step, onNext }) => {
     // FTUE logic would go here
    return null;
}

const App = () => {
    const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
    const [playerData, setPlayerDataState] = useState<PlayerData>(dataManager.get());
    const [runConfig, setRunConfig] = useState<FinalRunConfig | null>(null);
    const [currentLevel, setCurrentLevel] = useState(0);

    const setPlayerData = (data: PlayerData) => {
        dataManager.set(data);
        setPlayerDataState(data);
    }
    
    const handleStartGame = (levelIndex: number) => {
        const config = { /* Generate RunConfig logic based on playerData */ 
            baseFireRate: 2, baseUnitsPerShot: 1, baseUnitPower: 5,
            additiveBonuses: {}, multiplicativeBonuses: {}, gateModifiers: {}, rewardMultiplier: 1
        };
        setRunConfig(config);
        setCurrentLevel(levelIndex);
        setGameState('playing');
    };

    const handleGameOver = (win: boolean, goldReward: number) => {
        if (win) {
            const newGold = playerData.gold + goldReward;
            const newMaxLevel = Math.max(playerData.maxLevelReached, currentLevel);
            setPlayerData({ ...playerData, gold: newGold, maxLevelReached: newMaxLevel });
        }
        setGameState('menu');
    };
    
    const ftueStep = playerData.isFirstVisit ? 0 : -1; // Simplified FTUE state

    return (
        <div className="app-container">
            {ftueStep !== -1 && <FtueOverlay step={ftueStep} onNext={() => {}} />}
            {gameState === 'playing' && runConfig ? (
                <Game runConfig={runConfig} onGameOver={handleGameOver} level={{...LEVELS[currentLevel], id: currentLevel }} />
            ) : (
                <Menu playerData={playerData} setPlayerData={setPlayerData} onStartGame={handleStartGame} />
            )}
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<React.StrictMode><App /></React.StrictMode>);
} else {
    console.error('Fatal: Root element with id "root" not found.');
}
