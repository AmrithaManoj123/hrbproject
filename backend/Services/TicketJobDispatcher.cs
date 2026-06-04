using Hangfire;

public static class TicketJobDispatcher
{
    public static void EnqueueClassify(long ticketId) => Enqueue(() => ClassifyTicketJob.Execute(ticketId));
    public static void EnqueuePredictPriority(long ticketId) => Enqueue(() => PredictPriorityJob.Execute(ticketId));
    public static void EnqueueAssign(long ticketId) => Enqueue(() => AssignTicketJob.Execute(ticketId));

    private static void Enqueue(System.Linq.Expressions.Expression<Action> hangfireJob)
    {
        if (AppFeatures.UseHangfire)
        {
            BackgroundJob.Enqueue(hangfireJob);
            return;
        }

        var compiledJob = hangfireJob.Compile();
        _ = Task.Run(async () =>
        {
            await Task.Delay(50);
            compiledJob();
        });
    }
}
