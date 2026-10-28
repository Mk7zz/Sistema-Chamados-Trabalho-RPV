# Testa o fluxo completo da API. Rode com a API no ar (npm run start:dev).
# Uso:  powershell -ExecutionPolicy Bypass -File .\testar-fluxo.ps1
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000'

function Post($url, $body) { Invoke-RestMethod -Method Post -Uri "$base$url" -ContentType 'application/json' -Body ($body | ConvertTo-Json) }
function Patch($url, $body) { Invoke-RestMethod -Method Patch -Uri "$base$url" -ContentType 'application/json' -Body ($body | ConvertTo-Json) }
function Get_($url) { Invoke-RestMethod -Method Get -Uri "$base$url" }

Write-Host "`n1) Cadastrando pessoas e tipo de problema..." -ForegroundColor Cyan
$sol = Post '/pessoas' @{ nome = 'Ana Solicitante'; email = "ana$(Get-Random)@empresa.com"; tipo = 'SOLICITANTE' }
$tec = Post '/pessoas' @{ nome = 'Bruno Tecnico'; email = "bruno$(Get-Random)@empresa.com"; tipo = 'TECNICO' }
$tipo = Post '/tipos-problema' @{ nome = "Rede-$(Get-Random)" }
Write-Host "   solicitante=$($sol.id)  tecnico=$($tec.id)  tipo=$($tipo.id)"

Write-Host "`n2) Abrindo chamado..." -ForegroundColor Cyan
$ch = Post '/chamados' @{ titulo = 'Sem acesso a rede'; descricao = 'A internet caiu no setor inteiro'; prioridade = 'ALTA'; solicitanteId = $sol.id; tipoProblemaId = $tipo.id }
Write-Host "   chamado=$($ch.id)  situacao=$($ch.situacao)  prioridade=$($ch.prioridade)"

Write-Host "`n3) Designando tecnico (deve iniciar atendimento)..." -ForegroundColor Cyan
$ch = Patch "/chamados/$($ch.id)/tecnico" @{ tecnicoId = $tec.id }
Write-Host "   situacao=$($ch.situacao)"

Write-Host "`n4) Comentarios (solicitante e tecnico)..." -ForegroundColor Cyan
Post "/chamados/$($ch.id)/comentarios" @{ autorId = $sol.id; texto = 'Continua sem acesso.' } | Out-Null
Post "/chamados/$($ch.id)/comentarios" @{ autorId = $tec.id; texto = 'Verificando o switch.' } | Out-Null
Write-Host "   2 comentarios adicionados"

Write-Host "`n5) Resolvendo e fechando..." -ForegroundColor Cyan
$ch = Patch "/chamados/$($ch.id)/situacao" @{ situacao = 'RESOLVIDO' }
Write-Host "   situacao=$($ch.situacao)  resolvidoEm=$($ch.resolvidoEm)"
$ch = Patch "/chamados/$($ch.id)/situacao" @{ situacao = 'FECHADO' }
Write-Host "   situacao=$($ch.situacao)"

Write-Host "`n6) Chamado completo com a conversa:" -ForegroundColor Cyan
Get_ "/chamados/$($ch.id)" | ConvertTo-Json -Depth 6

Write-Host "`n7) Testes de regra (devem FALHAR com 4xx):" -ForegroundColor Yellow
try { Post "/chamados/$($ch.id)/comentarios" @{ autorId = $sol.id; texto = 'tarde demais' }; Write-Host '   ERRO: comentou em chamado fechado' -ForegroundColor Red }
catch { Write-Host "   OK: comentario em fechado bloqueado ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green }

try { Post '/chamados' @{ titulo = 'abc'; descricao = 'curta'; solicitanteId = $sol.id; tipoProblemaId = $tipo.id }; Write-Host '   ERRO: aceitou titulo/descricao invalidos' -ForegroundColor Red }
catch { Write-Host "   OK: validacao de titulo/descricao ($($_.Exception.Response.StatusCode.value__))" -ForegroundColor Green }

Write-Host "`nFluxo concluido." -ForegroundColor Cyan
