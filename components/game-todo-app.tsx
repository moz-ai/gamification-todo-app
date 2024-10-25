'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Trash2, X, GripVertical, ArrowLeft, Lock, BarChart, Home, Dice5, Users, BarChart2, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Todo {
  id: number
  text: string
  completed: boolean
  isEditing: boolean
  hasAwardedExp: boolean
  completedAt?: Date
}

interface Character {
  id: string
  name: string
  image: string
  description: string
}

interface GameState {
  level: number
  exp: number
  expToNextLevel: number
  characters: Character[]
  currentCharacter: Character
  gachaStones: number
}

const allCharacters: Character[] = [
  { id: 'chick', name: 'ひよこ', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hiyoko-LAa2txjE73zJAzn8vuEfJWPi42oqjt.png', description: 'かわいいひよこです。一生懸命頑張ります！' },
  { id: 'bear', name: 'クマ', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bear-9V7pBjHsr9EZiDjJnHHUNv0RVD3lUM.png', description: 'のんびり屋のクマです。ゆっくり確実に物事を進めます。' },
  { id: 'penguin', name: 'ペンギン', image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/penguin-zyCvOb6u87HttB4FwJKZnhpzihVoVG.png', description: '寒さに強いペンギンです。困難にも負けません！' },
]

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg relative w-full max-w-[90%] mx-auto max-h-[90%] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

const StatusBar = ({ gameState }: { gameState: GameState }) => (
  <div className="w-full text-center mb-4 relative">
    <p className="text-2xl font-bold">Lv. {gameState.level}</p>
    <Progress value={(gameState.exp / gameState.expToNextLevel) * 100} className="w-full mt-2" />
    <div className="absolute top-0 right-0 flex items-center">
      <span className="text-sm mr-1">💎</span>
      <span className="text-sm font-semibold">{gameState.gachaStones}</span>
    </div>
  </div>
)

export function GameTodoAppComponent() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    exp: 0,
    expToNextLevel: 100,
    characters: [allCharacters[0]],
    currentCharacter: allCharacters[0],
    gachaStones: 0,
  })
  const [showCompleted, setShowCompleted] = useState(false)
  const [currentPage, setCurrentPage] = useState<'character' | 'gacha' | 'characterList' | 'report'>('character')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [characterDialogue, setCharacterDialogue] = useState('')
  const [isGachaModalOpen, setIsGachaModalOpen] = useState(false)
  const [isCharacterDetailModalOpen, setIsCharacterDetailModalOpen] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [chatInput, setChatInput] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [characterResponse, setCharacterResponse] = useState('')

  const addTodo = () => {
    if (newTodo.trim() !== '') {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false, isEditing: false, hasAwardedExp: false }])
      setNewTodo('')
      showCharacterDialogue('新しいタスクを頑張ろう！')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const newCompleted = !todo.completed
        if (newCompleted && !todo.hasAwardedExp) {
          addExp(20)
          addGachaStone(1)
          showCharacterDialogue('タスク完了！よくがんばったね！ガチャ石を1つゲットしたよ！')
          return { ...todo, completed: newCompleted, hasAwardedExp: true, completedAt: new Date() }
        }
        return { ...todo, completed: newCompleted }
      }
      return todo
    }))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const startEditing = (id: number) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, isEditing: true } : { ...todo, isEditing: false }
    ))
  }

  const stopEditing = (id: number, newText?: string) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, isEditing: false, text: newText !== undefined ? newText : todo.text }
        : todo
    ))
  }

  const addExp = (amount: number) => {
    setGameState(prev => {
      const newExp = prev.exp + amount
      if (newExp >= prev.expToNextLevel) {
        showCharacterDialogue('レベルアップ！おめでとう！')
        return {
          ...prev,
          level: prev.level + 1,
          exp: newExp - prev.expToNextLevel,
          expToNextLevel: Math.floor(prev.expToNextLevel * 1.5)
        }
      }
      return { ...prev, exp: newExp }
    })
  }

  const addGachaStone = (amount: number) => {
    setGameState(prev => ({
      ...prev,
      gachaStones: prev.gachaStones + amount
    }))
  }

  const performGacha = () => {
    if (gameState.gachaStones < 5) {
      showCharacterDialogue('ガチャ石が足りないよ！もう少し頑張ろう！')
      return
    }

    const unownedCharacters = allCharacters.filter(char => !gameState.characters.some(owned => owned.id === char.id))
    if (unownedCharacters.length === 0) {
      showCharacterDialogue('すべてのキャラクターを獲得しました！')
      return
    }

    setGameState(prev => ({
      ...prev,
      gachaStones: prev.gachaStones - 5
    }))

    const newCharacter = unownedCharacters[Math.floor(Math.random() * unownedCharacters.length)]
    setGameState(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter],
    }))
    setSelectedCharacter(newCharacter)
    setIsGachaModalOpen(true)
    showCharacterDialogue(`新しいキャラクター「${newCharacter.name}」を獲得しました！`)
  }

  const changeCurrentCharacter = (character: Character) => {
    setGameState(prev => ({
      ...prev,
      currentCharacter: character,
    }))
    setCurrentPage('character')
    setIsCharacterDetailModalOpen(false)
    showCharacterDialogue('よろしくね！一緒に頑張ろう！')
  }

  const showCharacterDialogue = (message: string) => {
    setCharacterDialogue(message)
    setTimeout(() => setCharacterDialogue(''), 5000) // Hide dialogue after 5 seconds
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (chatInput.trim() !== '') {
      setUserMessage(chatInput)
      setChatInput('')
      
      // Simple character response logic
      setTimeout(() => {
        const response = `${gameState.currentCharacter.name}です。${chatInput}ですね。一緒に頑張りましょう！`
        setCharacterResponse(response)
      }, 1000)
    }
  }

  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [todos])

  const activeTodos = todos.filter(todo => !todo.completed)
  const completedTodos = todos.filter(todo => todo.completed)

  const CharacterPage = () => (
    <div className="flex flex-col items-center justify-between h-full relative">
      <StatusBar gameState={gameState} />
      <div className="flex-grow flex flex-col items-center justify-center relative">
        <div className="relative">
          {(characterDialogue || characterResponse) && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-full bg-white border border-gray-200 rounded-lg p-4 shadow-lg animate-fade-in-out z-10 mb-2">
              <p className="text-sm">{characterDialogue || characterResponse}</p>
            </div>
          )}
          <img
            src={gameState.currentCharacter.image}
            alt={`${gameState.currentCharacter.name}キャラクター`}
            className={`w-48 h-48 object-contain transition-transform ${characterDialogue || characterResponse ? 'animate-talking' : ''}`}
          />
        </div>
      </div>
      <div className="w-full mt-4">
        {userMessage && (
          <div className="mb-2 text-right">
            <span className="inline-block p-2 rounded-lg bg-primary text-primary-foreground">
              {userMessage}
            </span>
          </div>
        )}
        <form onSubmit={handleChatSubmit} className="flex flex-col space-y-2">
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`${gameState.currentCharacter.name}と会話する...`}
            className="resize-none"
          />
          <Button type="submit" className="w-full">
            <Send className="w-4 h-4 mr-2" />
            送信
          </Button>
        </form>
      </div>
    </div>
  )

  const GachaPage = () => (
    <div className="flex flex-col items-center justify-between h-full relative">
      <StatusBar gameState={gameState} />
      <div className="flex-grow flex flex-col items-center justify-center">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/gachagacha-pglDW7R9gGcH655XURp0iM0pMM856G.png"
          alt="ガチャガチャマシン"
          className="w-64 h-64 object-contain mb-4"
        />
        <div className="flex items-center justify-center mb-2">
          <span className="text-lg mr-2">💎</span>
          <p className="text-lg font-semibold">{gameState.gachaStones} / 5</p>
        </div>
        <Button
          className="w-full max-w-xs"
          onClick={performGacha}
          disabled={gameState.gachaStones < 5}
        >
          ガチャを引く (5個)
        </Button>
      </div>
      <Modal isOpen={isGachaModalOpen} onClose={() => setIsGachaModalOpen(false)}>
        {selectedCharacter && (
          <div className="flex flex-col items-center">
            <img
              src={selectedCharacter.image}
              alt={`${selectedCharacter.name}キャラクター`}
              className="w-24 h-24 object-contain mb-2"
            />
            <h3 className="text-lg font-semibold mb-1">{selectedCharacter.name}</h3>
            <p className="text-xs text-muted-foreground mb-2 text-center">
              {selectedCharacter.description}
            </p>
            <Button
              className="w-full"
              onClick={() => {
                changeCurrentCharacter(selectedCharacter)
                setIsGachaModalOpen(false)
              }}
            >
              このキャラクターを選択
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )

  const CharacterListPage = () => (
    <div className="flex flex-col items-center justify-between h-full relative">
      <StatusBar gameState={gameState} />
      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md">
        <div className="grid  grid-cols-2 gap-4 w-full">
          {allCharacters.map((character) => {
            const isOwned = gameState.characters.some(owned => owned.id === character.id)
            return (
              <div
                key={character.id}
                className={`flex flex-col items-center p-4 bg-muted rounded-lg ${isOwned ? 'cursor-pointer hover:bg-muted/80' : ''}`}
                onClick={() => {
                  if (isOwned) {
                    setSelectedCharacter(character)
                    setIsCharacterDetailModalOpen(true)
                  }
                }}
              >
                <div className="relative w-24 h-24 mb-2">
                  {isOwned ? (
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-black rounded-md flex items-center justify-center">
                      <Lock className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium">
                  {isOwned ? character.name : '???'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const calculateConsecutiveDays = () => {
    if (completedTodos.length === 0) return 0;

    const sortedCompletedTodos = completedTodos
      .filter(todo => todo.completedAt)
      .sort((a, b) => (b.completedAt as Date).getTime() - (a.completedAt as Date).getTime());

    let consecutiveDays = 1;
    let currentDate = new Date(sortedCompletedTodos[0].completedAt as Date);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sortedCompletedTodos.length; i++) {
      const todoDate = new Date(sortedCompletedTodos[i].completedAt as Date);
      todoDate.setHours(0, 0, 0, 0);

      const diffDays = (currentDate.getTime() - todoDate.getTime()) / (1000 * 3600 * 24);

      if (diffDays === 1) {
        consecutiveDays++;
        currentDate = todoDate;
      } else if (diffDays > 1) {
        break;
      }
    }

    return consecutiveDays;
  };

  const ReportPage = () => {
    const totalCompletedTasks = completedTodos.length;
    const thisWeekCompletedTasks = completedTodos.filter(todo => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return todo.completedAt && todo.completedAt > oneWeekAgo;
    }).length;
    const consecutiveDays = calculateConsecutiveDays();

    return (
      <div className="flex flex-col items-center justify-between h-full relative">
        <StatusBar gameState={gameState} />
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-md space-y-12">
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">総完了タスク数</h3>
            <p className="text-6xl font-bold">{totalCompletedTasks}</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">今週の達成数</h3>
            <p className="text-6xl font-bold">{thisWeekCompletedTasks}</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-medium mb-2">連続達成日数</h3>
            <p className="text-6xl font-bold">{consecutiveDays}</p>
          </div>
        </div>
      </div>
    );
  };

  const NavigationBar = () => (
    <div className="flex justify-around items-center bg-muted p-2 rounded-lg">
      {[
        { icon: Home, label: 'トップ', page: 'character' },
        { icon: Dice5, label: 'ガチャ', page: 'gacha' },
        { icon: Users, label: 'キャラ', page: 'characterList' },
        { icon: BarChart2, label: 'レポート', page: 'report' },
      ].map(({ icon: Icon, label, page }) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "ghost"}
          className={`flex flex-col items-center p-2 ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => setCurrentPage(page)}
        >
          <Icon className={`h-6 w-6 mb-1 ${currentPage === page ? 'text-primary-foreground' : ''}`} />
          <span className={`text-xs ${currentPage === page ? 'font-bold' : ''}`}>{label}</span>
        </Button>
      ))}
    </div>
  )

  useEffect(() => {
    const style = document.createElement('style');
    const fadeInOutKeyframes = `
      @keyframes fadeInOut {
        0%, 100% { opacity: 0; transform: translateY(10px); }
        5%, 95% { opacity: 1; transform: translateY(0); }
      }
      @keyframes talking {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
    `;
    style.innerHTML = fadeInOutKeyframes + `
      .animate-talking {
        animation: talking 0.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen p-4 bg-background">
      <div className="w-full md:w-1/3 p-4 bg-card rounded-lg shadow-lg mb-4 md:mb-0 md:mr-4 flex flex-col overflow-hidden">
        <div className="flex-grow overflow-y-auto relative">
          {currentPage === 'character' && <CharacterPage />}
          {currentPage === 'gacha' && <GachaPage />}
          {currentPage === 'characterList' && <CharacterListPage />}
          {currentPage === 'report' && <ReportPage />}
        </div>
        <NavigationBar />
      </div>
      <div className="w-full md:w-2/3 p-4 bg-card rounded-lg shadow-lg flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-center">TODOリスト</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            <Label htmlFor="show-completed">完了したタスクを表示</Label>
          </div>
        </div>
        <div className="flex mb-4">
          <Input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="新しいタスクを入力..."
            className="mr-2"
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          />
          <Button onClick={addTodo}>追加</Button>
        </div>
        <div className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Reorder.Group axis="y" values={activeTodos} onReorder={(newOrder) => setTodos([...newOrder, ...completedTodos])}>
            <AnimatePresence>
              {activeTodos.map((todo) => (
                <Reorder.Item key={todo.id} value={todo} as="div">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-muted p-3 rounded-md mb-2"
                  >
                    <div className="flex items-center flex-grow mr-2">
                      <GripVertical className="h-5 w-5 mr-2 cursor-move text-muted-foreground" />
                      <Checkbox
                        id={`todo-${todo.id}`}
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="mr-2"
                      />
                      {todo.isEditing ? (
                        <Input
                          ref={editInputRef}
                          type="text"
                          defaultValue={todo.text}
                          onBlur={(e) => stopEditing(todo.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') stopEditing(todo.id, e.currentTarget.value)
                            if (e.key === 'Escape') stopEditing(todo.id)
                          }}
                          className="flex-grow"
                        />
                      ) : (
                        <label
                          htmlFor={`todo-${todo.id}`}
                          className={`flex-grow cursor-pointer ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                          onClick={() => startEditing(todo.id)}
                        >
                          {todo.text}
                        </label>
                      )}
                    </div>
                    {todo.isEditing ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => stopEditing(todo.id)}
                        aria-label="編集をキャンセル"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo(todo.id)}
                        aria-label="タスクを削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </motion.div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
          {showCompleted && completedTodos.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">完了したタスク</h3>
              <AnimatePresence>
                {completedTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-muted p-3 rounded-md mb-2"
                  >
                    <div className="flex items-center flex-grow mr-2">
                      <Checkbox
                        id={`completed-todo-${todo.id}`}
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="mr-2"
                      />
                      <label
                        htmlFor={`completed-todo-${todo.id}`}
                        className="flex-grow cursor-pointer line-through text-muted-foreground"
                      >
                        {todo.text}
                      </label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      aria-label="タスクを削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}